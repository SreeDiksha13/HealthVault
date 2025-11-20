# OSM Data Directory

## Download Instructions

To get hospital data for India, follow these steps:

### 1. Download India OSM Data

Visit: [Geofabrik India Download](https://download.geofabrik.de/asia/india.html)

Download the file: **india-latest.osm.pbf** (~1.2 GB)

### 2. Place the File

Move the downloaded `india-latest.osm.pbf` file to this directory.

### 3. Run the Import Script

From the backend directory, run:

```bash
npm run import-osm
```

## File Information

- **Format**: PBF (Protocolbuffer Binary Format)
- **Size**: ~1-2 GB (compressed)
- **Update Frequency**: Daily
- **Contains**: All OpenStreetMap data for India

## Alternative: State-Specific Downloads

If you only want specific states, you can download them individually:

- Karnataka: https://download.geofabrik.de/asia/india/karnataka-latest.osm.pbf
- Maharashtra: https://download.geofabrik.de/asia/india/maharashtra-latest.osm.pbf
- Tamil Nadu: https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf
- etc.

## Processing Time

Importing the entire India dataset may take 10-30 minutes depending on your system.

Progress will be displayed in the console.
