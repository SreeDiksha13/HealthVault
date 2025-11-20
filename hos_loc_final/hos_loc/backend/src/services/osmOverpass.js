import axios from "axios";
import { config } from "../config/index.js";

export async function fetchNearby(lat, lng, radius = 5000) {
  const query = `
  [out:json];
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  out body;
  `;
  const res = await axios.post(config.overpassApi, query, { headers: { "Content-Type": "text/plain" } });
  return res.data.elements.map((el) => ({
    source: "osm",
    sourceId: el.id,
    name: el.tags.name,
    address: el.tags["addr:full"],
    specialties: el.tags["healthcare:speciality"]
      ? [{ name: el.tags["healthcare:speciality"] }]
      : [],
    location: { type: "Point", coordinates: [el.lon, el.lat] },
  }));
}
