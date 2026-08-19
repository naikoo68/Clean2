import "dotenv/config";
// Ensure the global tenantId plugin is registered BEFORE any model compiles.
import "../config/registerModelPlugins.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Tenant from "../models/Tenant.js";
import Settings from "../models/Settings.js";

// One-time (idempotent) migration for Phase 2:
//   1. Ensure a DEFAULT tenant exists (the institute all existing data belongs
//      to, so nothing breaks when scoping turns on in Phase 3).
//   2. Backfill `tenantId` = default on every existing tenant-owned document.
//   3. Create a { tenantId: 1 } index on each of those collections.
//
// Safe to run multiple times: it only touches documents that don't already
// have a tenantId, and index creation is idempotent.
//
// Run with:  npm run migrate:tenants   (from the backend/ folder)

// Every tenant-owned model — everything EXCEPT the Tenant registry itself.
const MODEL_FILES = [
  "AiKey", "Attempt", "CbtAttempt", "CbtRegistration", "ContentShare", "Coupon",
  "Document", "Exam", "ExamPost", "FbSchedule", "Feedback", "Institution", "Message",
  "Notice", "PracticeStream", "PracticeSubject", "PracticeTopic", "PublicAttempt",
  "Question", "Quiz", "Review", "Session", "Settings", "SmClass", "SmFile", "SmSubject",
  "Stream", "Subject", "TestSeries", "Topic", "User", "UserManual",
];

async function loadModels() {
  for (const name of MODEL_FILES) {
    await import(`../models/${name}.js`); // registers the model on the connection
  }
}

async function ensureDefaultTenant() {
  const slug = String(process.env.DEFAULT_TENANT_SLUG || "default").toLowerCase();

  let tenant = await Tenant.findOne({ isDefault: true });
  if (!tenant) tenant = await Tenant.findOne({ slug });

  if (!tenant) {
    let name = process.env.DEFAULT_TENANT_NAME;
    if (!name) {
      const s = await Settings.findOne({ key: "site" }).select("siteName").lean();
      name = s?.siteName || "Default Institute";
    }
    tenant = await Tenant.create({ name, slug, status: "active", isDefault: true });
    console.log(`Created default tenant "${name}" (slug: ${slug}) -> ${tenant._id}`);
  } else if (!tenant.isDefault) {
    tenant.isDefault = true;
    await tenant.save();
    console.log(`Marked existing tenant ${tenant._id} (slug: ${tenant.slug}) as default`);
  } else {
    console.log(`Using existing default tenant ${tenant._id} (slug: ${tenant.slug})`);
  }
  return tenant._id;
}

async function run() {
  await connectDB();
  await loadModels();

  const tenantId = await ensureDefaultTenant();

  let totalBackfilled = 0;
  for (const name of MODEL_FILES) {
    const coll = mongoose.model(name).collection;
    // `{ tenantId: null }` matches BOTH missing and explicitly-null values.
    const res = await coll.updateMany({ tenantId: null }, { $set: { tenantId } });
    totalBackfilled += res.modifiedCount || 0;
    try {
      await coll.createIndex({ tenantId: 1 });
    } catch (e) {
      console.warn(`  index on ${name}.tenantId skipped: ${e.message}`);
    }
    console.log(`${name}: backfilled ${res.modifiedCount || 0} doc(s); tenantId index ensured`);
  }

  console.log(`\n✔ Tenant migration complete. Backfilled ${totalBackfilled} document(s) into tenant ${tenantId}.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Tenant migration FAILED:", err);
  process.exit(1);
});
