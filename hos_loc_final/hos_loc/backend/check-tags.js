import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from './src/models/Hospital.js';

dotenv.config();

async function checkOsmTags() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Get sample hospitals with their OSM tags
    const samples = await Hospital.find({ osmTags: { $exists: true } }).limit(20);
    
    console.log('=== Checking OSM Tags ===\n');
    samples.forEach((h, i) => {
      console.log(`${i + 1}. ${h.name}`);
      console.log('   State:', h.state);
      console.log('   City:', h.city);
      if (h.osmTags) {
        console.log('   OSM Tags:', JSON.stringify(h.osmTags, null, 2));
      }
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOsmTags();
