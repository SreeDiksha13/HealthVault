import mongoose from "mongoose";
import fs from "fs";
import dotenv from "dotenv";
import Doctor from "./models/Doctors.js";
import Patient from "./models/Patients.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI);

const seedDB = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    console.log("🧹 Cleared existing Doctor & Patient data.");

    const doctorsData = JSON.parse(fs.readFileSync("./data/new_doctors.json", "utf-8"));
    const patientsData = JSON.parse(fs.readFileSync("./data/new_patients.json", "utf-8"));

    // --- Step 1: Insert doctors (skip appointments + access temporarily)
    const cleanedDoctors = doctorsData.map(d => ({
      ...d,
      appointments: [],
      currentAccessToPatients: [],
    }));

    const insertedDoctors = await Doctor.insertMany(cleanedDoctors);
    console.log(`✅ Inserted ${insertedDoctors.length} doctors.`);

    const doctorMap = {};
    insertedDoctors.forEach(doc => (doctorMap[doc.name] = doc._id));

    // --- Step 2: Insert patients with proper doctor references
    const processedPatients = patientsData.map(p => {
      const mapIds = arr => arr.map(name => doctorMap[name]).filter(Boolean);

      return {
        ...p,
        visitedDoctors: mapIds(p.visitedDoctors || []),
        currentAccess: mapIds(p.currentAccess || []),
        accessRequests: (p.accessRequests || []).map(req => ({
          ...req,
          doctor: doctorMap[req.doctor] || null,
        })),
        reports: (p.reports || []).map(r => ({
          ...r,
          doctor: doctorMap[r.doctor] || null,
        })),
      };
    });

    const insertedPatients = await Patient.insertMany(processedPatients);
    console.log(`✅ Inserted ${insertedPatients.length} patients.`);

    const patientMap = {};
    insertedPatients.forEach(p => (patientMap[p.name] = p._id));

    // --- Step 3: Update doctors with real ObjectIds now that patients exist
    for (const doc of doctorsData) {
      const patientIds = (doc.currentAccessToPatients || [])
        .map(name => patientMap[name])
        .filter(Boolean);

      const appointments = (doc.appointments || []).map(appt => ({
        ...appt,
        patient: patientMap[appt.patient] || null,
      }));

      await Doctor.findOneAndUpdate(
        { name: doc.name },
        {
          currentAccessToPatients: patientIds,
          appointments,
        }
      );
    }

    console.log("🎯 Relationships established successfully!");
    console.log("✅ Seeding complete.");

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    mongoose.connection.close();
  }
};

seedDB();
