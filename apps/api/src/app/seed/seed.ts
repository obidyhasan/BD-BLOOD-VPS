
import { seedGeoData } from "./geoSeed";
import { seedBloodGroups } from "./bloodGroupSeed";
import { prisma } from "../shared/prisma";

async function main() {
  try {
    console.log("🚀 Starting database seeding...");
    
    await seedGeoData();
    await seedBloodGroups();
    
    console.log("✅ All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
