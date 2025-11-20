import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from './src/models/Hospital.js';

dotenv.config();

async function debugCities() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Check total hospitals
    const total = await Hospital.countDocuments();
    console.log('Total hospitals:', total);

    // Check how many have city data
    const withCity = await Hospital.countDocuments({ city: { $exists: true, $ne: null, $ne: '' } });
    console.log('Hospitals with city data:', withCity);
    console.log('Hospitals WITHOUT city data:', total - withCity);

    // Sample some hospitals to see their structure
    console.log('\n--- Sample hospitals ---');
    const samples = await Hospital.find().limit(5);
    samples.forEach(h => {
      console.log({
        name: h.name,
        city: h.city,
        state: h.state,
        address: h.address,
        coords: h.location.coordinates
      });
    });

    // Check cities for a specific state
    console.log('\n--- Cities in Karnataka ---');
    const karnatakaHospitals = await Hospital.find({ 
      state: new RegExp('karnataka', 'i') 
    }).limit(10);
    console.log('Found', karnatakaHospitals.length, 'hospitals in Karnataka');
    karnatakaHospitals.forEach(h => {
      console.log({
        name: h.name,
        city: h.city,
        state: h.state
      });
    });

    // Get city count for Karnataka
    const karnatakaCities = await Hospital.distinct('city', { 
      state: new RegExp('karnataka', 'i') 
    });
    console.log('\nUnique cities in Karnataka:', karnatakaCities.filter(c => c).length);
    console.log('Sample cities:', karnatakaCities.filter(c => c).slice(0, 20));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCities();
