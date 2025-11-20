import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import osmParser from 'osm-pbf-parser';
import through2 from 'through2';
import dotenv from 'dotenv';
import Hospital from '../models/Hospital.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB Connection - use from .env
const MONGODB_URI = process.env.MONGO_URI;

// Path to your downloaded OSM PBF file
const OSM_FILE_PATH = path.join(__dirname, '../../hos_loc_final/hos_loc/backend/data/india-251105.osm.pbf');

/**
 * Extract city and state from OSM tags
 */
function extractLocation(tags) {
  return {
    // Try multiple fields for city: addr:city, addr:district, addr:subdistrict
    city: tags['addr:city'] || tags['addr:district'] || tags['addr:subdistrict'] || tags.city || null,
    state: tags['addr:state'] || tags.state || null,
    postcode: tags['addr:postcode'] || tags.postcode || tags.postal_code || null,
    address: tags['addr:full'] || 
             [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ') ||
             tags.address || null,
  };
}

/**
 * Extract hospital specialties from OSM tags
 */
function extractSpecialties(tags) {
  const specialties = [];
  
  if (tags['healthcare:speciality']) {
    const specs = tags['healthcare:speciality'].split(';').map(s => s.trim());
    specialties.push(...specs);
  }
  
  if (tags.emergency === 'yes') {
    specialties.push('Emergency');
  }
  
  return specialties;
}

/**
 * Process OSM data and import hospitals into MongoDB
 */
async function importOsmHospitals() {
  console.log('🚀 Starting OSM Hospital Import...\n');

  // Check if file exists
  if (!fs.existsSync(OSM_FILE_PATH)) {
    console.error(`❌ Error: OSM file not found at ${OSM_FILE_PATH}`);
    console.log('\n📥 Please download the India OSM data:');
    console.log('1. Visit: https://download.geofabrik.de/asia/india.html');
    console.log('2. Download: india-latest.osm.pbf');
    console.log(`3. Place it in: ${path.join(__dirname, '../../hos_loc_final/hos_loc/backend/data/')}\n`);
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing hospitals completely for fresh import
    console.log('🗑️  Clearing existing hospitals...');
    await Hospital.deleteMany({});
    console.log('✅ Cleared existing data\n');

    let hospitalCount = 0;
    const batchSize = 100;
    let hospitalBatch = [];

    const parser = osmParser();

    console.log('📖 Reading OSM file...');
    console.log('File size:', (fs.statSync(OSM_FILE_PATH).size / 1024 / 1024).toFixed(2), 'MB\n');
    console.log('Processing hospitals...');

    return new Promise((resolve, reject) => {
      fs.createReadStream(OSM_FILE_PATH)
        .pipe(parser)
        .pipe(through2.obj(async (items, enc, next) => {
          for (const item of items) {
            // Process nodes (points)
            if (item.type === 'node' && item.tags) {
              const tags = item.tags;

              // Check if it's a hospital
              if (tags.amenity === 'hospital' || 
                  tags.healthcare === 'hospital' ||
                  tags.building === 'hospital') {
                
                const location = extractLocation(tags);
                const specialties = extractSpecialties(tags);

                const hospital = {
                  source: 'osm',
                  sourceId: `node/${item.id}`,
                  name: tags.name || tags['name:en'] || 'Unnamed Hospital',
                  address: location.address,
                  city: location.city,
                  state: location.state,
                  postcode: location.postcode,
                  phone: tags.phone || tags['contact:phone'] || null,
                  website: tags.website || tags['contact:website'] || null,
                  specialties: specialties,
                  latitude: item.lat,
                  longitude: item.lon,
                  location: {
                    type: 'Point',
                    coordinates: [item.lon, item.lat]
                  },
                  osmTags: tags
                };

                hospitalBatch.push(hospital);
                hospitalCount++;

                // Progress indicator
                if (hospitalCount % 100 === 0) {
                  process.stdout.write(`\r✓ Found ${hospitalCount} hospitals...`);
                }

                // Batch insert
                if (hospitalBatch.length >= batchSize) {
                  try {
                    await Hospital.insertMany(hospitalBatch, { ordered: false });
                  } catch (err) {
                    // Ignore duplicate key errors
                    if (err.code !== 11000) {
                      console.error('\nError inserting batch:', err.message);
                    }
                  }
                  hospitalBatch = [];
                }
              }
            }
          }
          next();
        }))
        .on('finish', async () => {
          // Insert remaining hospitals
          if (hospitalBatch.length > 0) {
            try {
              await Hospital.insertMany(hospitalBatch, { ordered: false });
            } catch (err) {
              if (err.code !== 11000) {
                console.error('\nError inserting final batch:', err.message);
              }
            }
          }

          console.log(`\n\n✅ Import completed!`);
          console.log(`📊 Total hospitals imported: ${hospitalCount}`);
          
          // Show statistics
          const stats = await Hospital.aggregate([
            { $group: { 
              _id: '$state', 
              count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } },
            { $limit: 15 }
          ]);

          console.log('\n📈 Top 15 states by hospital count:');
          stats.forEach(s => {
            console.log(`   ${s._id || 'Unknown'}: ${s.count}`);
          });

          // City statistics
          const cityStats = await Hospital.aggregate([
            { $match: { city: { $ne: null } } },
            { $group: { 
              _id: { state: '$state', city: '$city' },
              count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } },
            { $limit: 20 }
          ]);

          console.log('\n📈 Top 20 cities by hospital count:');
          cityStats.forEach(s => {
            console.log(`   ${s._id.city}, ${s._id.state || 'Unknown'}: ${s.count}`);
          });

          await mongoose.connection.close();
          console.log('\n✅ Database connection closed');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Error processing OSM file:', err);
          reject(err);
        });
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the import
importOsmHospitals();
