import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkHospitals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Hospital = mongoose.model('Hospital', new mongoose.Schema({}, { strict: false }));
    const count = await Hospital.countDocuments();
    
    console.log(`📊 Total hospitals in database: ${count}`);
    
    if (count > 0) {
      const sample = await Hospital.findOne();
      console.log('📄 Sample hospital:', JSON.stringify(sample, null, 2));
    } else {
      console.log('⚠️ No hospitals found in the database');
      console.log('💡 You need to import hospital data from the hos_loc module');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkHospitals();
