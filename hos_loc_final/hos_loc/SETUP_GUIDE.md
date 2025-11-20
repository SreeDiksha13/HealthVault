# 🏥 Hospital Locator - Setup Guide

## Quick Start with Local OSM Data

This guide will help you set up the hospital locator with local OpenStreetMap data for India.

---

## 📥 Step 1: Download OSM Data

### Option A: Full India Dataset (Recommended)
1. Visit [Geofabrik India Downloads](https://download.geofabrik.de/asia/india.html)
2. Download `india-latest.osm.pbf` (~1.2 GB)
3. Place it in: `backend/data/india-latest.osm.pbf`

### Option B: State-Specific Dataset (Faster)
For specific states only:
- Karnataka: https://download.geofabrik.de/asia/india/karnataka-latest.osm.pbf
- Maharashtra: https://download.geofabrik.de/asia/india/maharashtra-latest.osm.pbf
- Tamil Nadu: https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf
- [See all states](https://download.geofabrik.de/asia/india.html)

---

## 🛠️ Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

This will install:
- `osm-pbf-parser` - For parsing OSM PBF files
- `through2` - Stream processing
- All other dependencies

### Frontend
```bash
cd frontend
npm install
```

---

## 💾 Step 3: Import Hospital Data

Once you've placed the OSM file in `backend/data/`:

```bash
cd backend
npm run import-osm
```

**What happens:**
- Reads the OSM PBF file
- Extracts all hospitals (amenity=hospital)
- Saves to MongoDB with:
  - Name, address, city, state
  - GPS coordinates
  - Phone, website (if available)
  - Specialties
- Creates geospatial indexes for fast "near me" queries

**Time estimate:**
- Full India: 10-30 minutes
- Single state: 1-5 minutes

**Progress:** You'll see live updates like:
```
✓ Found 100 hospitals...
✓ Found 200 hospitals...
✓ Found 5000 hospitals...
```

---

## 🚀 Step 4: Start the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
Server runs on: `http://localhost:4000`

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🎯 Features Available

### 1. **Hospitals Near Me**
- Click "📍 Hospitals Near Me" button
- Allow location access
- See hospitals within selected radius (1-50 km)

### 2. **Filter by State**
- Select any Indian state from dropdown
- Instantly see all hospitals in that state

### 3. **Filter by City**
- First select a state
- Then select a city within that state
- See city-specific hospitals

### 4. **Search by Name**
- Type hospital name in search box
- Real-time search across all hospitals

### 5. **Combined Filters**
- Use multiple filters together
- Example: "Hospitals in Karnataka > Bangalore > within 5km of me"

---

## 📊 API Endpoints

### Get Hospitals with Filters
```
GET /api/hospitals
Query params:
  - state: Filter by state (e.g., "Karnataka")
  - city: Filter by city (e.g., "Bangalore")
  - search: Search hospital name
  - lat, lng: Your coordinates
  - radius: Search radius in meters
  - limit: Max results (default: 100)
```

### Get States List
```
GET /api/hospitals/filters/states
Returns: Array of all states with hospitals
```

### Get Cities by State
```
GET /api/hospitals/filters/cities?state=Karnataka
Returns: Array of cities in that state
```

### Get Statistics
```
GET /api/hospitals/stats
Returns: Total count and breakdown by state
```

---

## 🔧 Troubleshooting

### "OSM file not found"
- Ensure file is at: `backend/data/india-latest.osm.pbf`
- Check file name matches exactly

### "MongoDB connection failed"
- Make sure MongoDB is running
- Check connection string in `.env`
- Default: `mongodb://localhost:27017/hospital_locator`

### "No hospitals showing"
- Run the import script first: `npm run import-osm`
- Check MongoDB has data: 
  ```bash
  mongosh
  use hospital_locator
  db.hospitals.count()
  ```

### Location not working
- Enable location in browser settings
- Use HTTPS (or localhost is fine for testing)
- Check browser console for errors

---

## 📈 Performance

### Database Indexes
The app creates these indexes for fast queries:
- `location`: 2dsphere index for geospatial queries
- `state, city`: Compound index for filtering
- `name`: Text index for search

### Query Speed
- **Near me queries**: < 100ms (finds nearest hospitals)
- **State filter**: < 50ms (indexed)
- **City filter**: < 50ms (indexed)
- **Search**: < 100ms (text index)

### Data Size
- ~10,000-20,000 hospitals for all of India
- MongoDB size: ~50-100 MB
- Much faster than API calls!

---

## 🔄 Updating Data

OSM data is updated daily. To refresh:

1. Download latest PBF file
2. Run import script again:
   ```bash
   npm run import-osm
   ```
3. The script clears old OSM data before importing

---

## 💡 Tips

1. **First Import**: Import full India dataset once
2. **Geolocation**: Always works better on HTTPS
3. **Filters**: Combine multiple filters for precise results
4. **Map**: Click markers to see hospital details
5. **Radius**: Adjust for urban (1-5km) vs rural (25-50km) areas

---

## 🎨 Customization

### Change Default Radius
In `frontend/src/pages/Dashboard.jsx`:
```javascript
const [radius, setRadius] = useState(10000); // Change to your preference
```

### Change Result Limit
In `frontend/src/pages/Dashboard.jsx`:
```javascript
params.append("limit", 500); // Increase/decrease
```

### Add More Filters
Add new query params in backend routes and frontend state

---

## 📞 Support

If you encounter issues:
1. Check MongoDB is running
2. Verify OSM file exists and is not corrupted
3. Check console logs in browser and terminal
4. Ensure all dependencies installed correctly

---

Enjoy your lightning-fast hospital locator! 🚀
