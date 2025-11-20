import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/hospitals';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test stats
    console.log('1. Testing /stats endpoint:');
    const stats = await axios.get(`${BASE_URL}/stats`);
    console.log('   Total hospitals:', stats.data.total);
    console.log('   Top states:', stats.data.byState.slice(0, 5));
    console.log('');

    // Test states filter
    console.log('2. Testing /filters/states endpoint:');
    const states = await axios.get(`${BASE_URL}/filters/states`);
    console.log('   States found:', states.data.length);
    console.log('   First 10 states:', states.data.slice(0, 10));
    console.log('');

    // Test cities filter
    console.log('3. Testing /filters/cities endpoint (Karnataka):');
    const cities = await axios.get(`${BASE_URL}/filters/cities?state=Karnataka`);
    console.log('   Cities found:', cities.data.length);
    console.log('   Sample cities:', cities.data.slice(0, 10));
    console.log('');

    // Test get hospitals
    console.log('4. Testing GET /api/hospitals (limit 5):');
    const hospitals = await axios.get(`${BASE_URL}?limit=5`);
    console.log('   Hospitals returned:', hospitals.data.count);
    if (hospitals.data.hospitals.length > 0) {
      console.log('   Sample hospital:', hospitals.data.hospitals[0]);
    }
    console.log('');

    console.log('✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAPI();
