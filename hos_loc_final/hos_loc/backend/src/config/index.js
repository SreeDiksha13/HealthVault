import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI,
  googleApiKey: process.env.GOOGLE_PLACES_API_KEY,
  overpassApi: process.env.OVERPASS_API,
};
