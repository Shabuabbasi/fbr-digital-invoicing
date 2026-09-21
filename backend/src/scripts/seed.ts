// One-time bootstrap: creates the first Company + ADMIN user so there's someone who can log in.
// There is no public self-registration endpoint (per spec, users are managed by an ADMIN).
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db";
import { env } from "../config/env";
import { Company } from "../models/Company";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

async function seed() {
  await connectDatabase();

  const existingAdmin = await User.findOne({ email: env.seed.adminEmail.toLowerCase() });
  let company = await Company.findOne({ name: env.seed.companyName });
  
  if (!company) {
    company = await Company.create({ name: env.seed.companyName, invoicePrefix: "INV" });
  }

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.seed.adminPassword, 10);
    await User.create({
      companyId: company._id,
      name: "Admin",
      email: env.seed.adminEmail.toLowerCase(),
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });
  } else {
    logger.info("Seed admin already exists, skipping user creation.", { email: env.seed.adminEmail });
  }

  const productCount = await Product.countDocuments({ companyId: company._id });
  if (productCount === 0) {
    await Product.insertMany([
      {
        companyId: company._id,
        name: "Software License (Annual)",
        sku: "SW-LIC-001",
        description: "Annual subscription for enterprise software suite",
        unit: "pcs",
        salePriceMinor: 15000000,
        taxRateBasisPoints: 1800,
        hsCode: "8523.4920",
      },
      {
        companyId: company._id,
        name: "IT Consulting Services",
        sku: "SRV-CON-001",
        description: "Hourly rate for senior IT consultant",
        unit: "hours",
        salePriceMinor: 2500000,
        taxRateBasisPoints: 1500,
      },
      {
        companyId: company._id,
        name: "Server Hosting (Monthly)",
        sku: "SRV-HST-001",
        description: "Monthly dedicated server hosting plan",
        unit: "months",
        salePriceMinor: 5000000,
        taxRateBasisPoints: 1800,
      },
    ]);
    logger.info("Seed complete.", { company: company.name, adminEmail: env.seed.adminEmail, productsAdded: 3 });
  } else {
    logger.info("Products already exist, skipping product creation.");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error("Seed failed", { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
