import express from "express";
import Hospital from "../models/Hospital.js";

const router = express.Router();

// ✅ GET hospital statistics (MUST come before /)
router.get("/stats", async (req, res) => {
  try {
    const total = await Hospital.countDocuments();
    const byState = await Hospital.aggregate([
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      total,
      byState: byState.map(s => ({ state: s._id, count: s.count }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET unique states (for filter dropdown) - MUST come before /
router.get("/filters/states", async (req, res) => {
  try {
    const states = await Hospital.distinct("state");
    res.json(states.filter(s => s).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET unique cities by state (for filter dropdown) - MUST come before /
router.get("/filters/cities", async (req, res) => {
  try {
    const { state } = req.query;
    const query = state ? { state: new RegExp(state, 'i') } : {};
    const cities = await Hospital.distinct("city", query);
    res.json(cities.filter(c => c).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET hospitals with filters (state, city, search, nearby)
router.get("/", async (req, res) => {
  try {
    const { state, city, search, lat, lng, radius, limit } = req.query;
    
    let query = {};

    // Filter by state
    if (state) {
      query.state = new RegExp(state, 'i'); // Case-insensitive
    }

    // Filter by city
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    // Search by name
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    let hospitals;

    // Nearby search using geospatial query
    if (lat && lng) {
      const maxDistance = radius ? parseInt(radius) : 10000; // Default 10km
      
      hospitals = await Hospital.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: maxDistance
          }
        }
      }).limit(limit ? parseInt(limit) : 100000); // Default to 100k if no limit specified
    } else {
      // Regular query without geospatial - fetch ALL matching hospitals
      hospitals = await Hospital.find(query).limit(limit ? parseInt(limit) : 100000);
    }

    res.json({
      count: hospitals.length,
      hospitals: hospitals.map(h => ({
        id: h._id,
        name: h.name,
        address: h.address,
        city: h.city,
        state: h.state,
        postcode: h.postcode,
        phone: h.phone,
        website: h.website,
        specialties: h.specialties,
        latitude: h.location.coordinates[1],
        longitude: h.location.coordinates[0],
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ADD a hospital (manual entry)
router.post("/", async (req, res) => {
  try {
    const { name, latitude, longitude, address, city, state, specialties, phone, website } = req.body;

    const hospital = new Hospital({
      source: 'manual',
      name,
      address,
      city,
      state,
      phone,
      website,
      specialties: specialties || [],
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });

    const newHospital = await hospital.save();
    res.status(201).json(newHospital);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ UPDATE hospital
router.put("/:id", async (req, res) => {
  try {
    const updated = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ DELETE hospital
router.delete("/:id", async (req, res) => {
  try {
    await Hospital.findByIdAndDelete(req.params.id);
    res.json({ message: "Hospital deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
