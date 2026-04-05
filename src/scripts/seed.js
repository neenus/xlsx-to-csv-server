/**
 * Database seed script
 *
 * Usage:
 *   npm run seed             — import all data
 *   npm run seed -- --wipe   — drop all collections then import
 *   npm run seed -- --delete — drop all collections without importing
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../config/db");
const Contractor = require("../models/Contractor.model");
const Service = require("../models/Service.model");

const contractorsData = require("../data/contractors.json");
const servicesData = require("../data/services.json");

const wipe = process.argv.includes("--wipe");
const deleteOnly = process.argv.includes("--delete");

const dropCollections = async () => {
  console.log("Dropping collections...");
  await Contractor.deleteMany({});
  await Service.deleteMany({});
  console.log("Collections dropped.");
};

const importData = async () => {
  console.log("Seeding contractors...");
  const contractors = await Contractor.insertMany(contractorsData);
  console.log(`  ✓ ${contractors.length} contractors inserted`);

  console.log("Seeding services...");
  const services = await Service.insertMany(servicesData);
  console.log(`  ✓ ${services.length} services inserted`);
};

const run = async () => {
  await connectDB();

  try {
    if (wipe || deleteOnly) {
      await dropCollections();
    }

    if (!deleteOnly) {
      await importData();
    }

    console.log("Done.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await closeDB();
  }
};

run();
