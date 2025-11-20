import Hospital from "../models/Hospital.js";
import { fetchNearby as fetchGoogle } from "./googlePlaces.js";
import { fetchNearby as fetchOSM } from "./osmOverpass.js";

export async function syncHospitals(lat, lng, radius = 5000) {
  const [googleHospitals, osmHospitals] = await Promise.all([
    fetchGoogle(lat, lng, radius),
    fetchOSM(lat, lng, radius)
  ]);

  const all = [...googleHospitals, ...osmHospitals];
  for (const h of all) {
    await Hospital.findOneAndUpdate(
      { source: h.source, sourceId: h.sourceId },
      { $set: h },
      { upsert: true }
    );
  }
  return all;
}

export async function searchHospitals(lat, lng, radius = 5000) {
  return Hospital.find({
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  });
}
