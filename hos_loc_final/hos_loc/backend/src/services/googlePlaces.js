import axios from "axios";
import { config } from "../config/index.js";

export async function fetchNearby(lat, lng, radius = 5000) {
  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
  const params = { key: config.googleApiKey, location: `${lat},${lng}`, radius, type: "hospital" };
  const res = await axios.get(url, { params });

  return res.data.results.map((h) => ({
    source: "google",
    sourceId: h.place_id,
    name: h.name,
    address: h.vicinity,
    specialties: (h.types || []).map(t => ({ name: t })),
    location: { type: "Point", coordinates: [h.geometry.location.lng, h.geometry.location.lat] },
  }));
}
