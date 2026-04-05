/**
 * Database migration script — rename model fields
 *
 * Renames fields in-place using MongoDB $rename so existing data is preserved.
 *
 * Contractor collection:
 *   name     → contractor_name
 *   address  → contractor_address
 *   city     → contractor_city
 *   state    → contractor_state
 *   zip      → contractor_zip
 *   phone    → contractor_phone
 *   email    → contractor_email
 *
 * Service collection:
 *   education_level → service_education_level
 *
 * Usage:
 *   node src/scripts/migrate.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../config/db");

const migrateContractors = async () => {
  console.log("Migrating contractors...");
  const result = await mongoose.connection.collection("contractors").updateMany(
    {},
    {
      $rename: {
        name: "contractor_name",
        address: "contractor_address",
        city: "contractor_city",
        state: "contractor_state",
        zip: "contractor_zip",
        phone: "contractor_phone",
        email: "contractor_email"
      }
    }
  );
  console.log(`  ✓ ${result.modifiedCount} contractor document(s) updated`);
};

const migrateServices = async () => {
  console.log("Migrating services...");
  const result = await mongoose.connection.collection("services").updateMany(
    {},
    { $rename: { education_level: "service_education_level" } }
  );
  console.log(`  ✓ ${result.modifiedCount} service document(s) updated`);
};

const run = async () => {
  await connectDB();

  try {
    await migrateContractors();
    await migrateServices();
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await closeDB();
  }
};

run();
