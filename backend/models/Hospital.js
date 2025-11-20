import mongoose from "mongoose";

const HospitalSchema = new mongoose.Schema({
  source: String,
  sourceId: String,
  name: String,
  address: String,
  phone: String,
  contactNumber: String, // Alternative phone field
  website: String,
  city: String,
  state: String,
  country: { type: String, default: "India" },
  postcode: String,
  type: String, // Hospital type: Multispecialty, General, etc.
  specialties: [String], // Array of specialty names
  latitude: Number, // Direct latitude field
  longitude: Number, // Direct longitude field
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number], // [longitude, latitude]
  },
  osmTags: mongoose.Schema.Types.Mixed, // Store all OSM tags for reference
  lastUpdated: Date,
}, { timestamps: true });

// Create geospatial index on location if coordinates exist
HospitalSchema.pre('save', function(next) {
  // If latitude/longitude exist but no location coordinates, create them
  if (this.latitude && this.longitude && (!this.location || !this.location.coordinates)) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

// Index for geospatial queries
HospitalSchema.index({ location: "2dsphere" });

// Index for filtering
HospitalSchema.index({ state: 1, city: 1 });
HospitalSchema.index({ name: "text" });

export default mongoose.model("Hospital", HospitalSchema);
