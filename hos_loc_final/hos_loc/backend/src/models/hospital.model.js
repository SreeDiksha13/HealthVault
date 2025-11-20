import mongoose from "mongoose";

const HospitalSchema = new mongoose.Schema({
  source: String,
  sourceId: String,
  name: String,
  address: String,
  phone: String,
  website: String,
  city: String,
  state: String,
  country: { type: String, default: "India" },
  postcode: String,
  specialties: [{ name: String }],
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number], // [longitude, latitude]
  },
  osmTags: mongoose.Schema.Types.Mixed, // Store all OSM tags for reference
}, { timestamps: true });

// Index for geospatial queries
HospitalSchema.index({ location: "2dsphere" });

// Index for filtering
HospitalSchema.index({ state: 1, city: 1 });
HospitalSchema.index({ name: "text" });

export default mongoose.model("Hospital", HospitalSchema);
