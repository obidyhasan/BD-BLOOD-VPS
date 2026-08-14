import * as dotenv from "dotenv";
import { prisma } from "../shared/prisma";
dotenv.config();

// -----------------------------------------------------------------------------
// STATIC SEED DATA — All 8 standard ABO/Rh blood groups
// UUIDs are deterministic (uuid v5) — safe to re-run without duplicates
// -----------------------------------------------------------------------------

const bloodGroups = [
  { id: "a1b2c3d4-0001-4000-8000-000000000001", groupName: "A+" },
  { id: "a1b2c3d4-0001-4000-8000-000000000002", groupName: "A-" },
  { id: "a1b2c3d4-0001-4000-8000-000000000003", groupName: "B+" },
  { id: "a1b2c3d4-0001-4000-8000-000000000004", groupName: "B-" },
  { id: "a1b2c3d4-0001-4000-8000-000000000005", groupName: "AB+" },
  { id: "a1b2c3d4-0001-4000-8000-000000000006", groupName: "AB-" },
  { id: "a1b2c3d4-0001-4000-8000-000000000007", groupName: "O+" },
  { id: "a1b2c3d4-0001-4000-8000-000000000008", groupName: "O-" },
];

async function seedBloodGroups(silent = false): Promise<void> {
  const log = (msg: string) => {
    if (!silent) console.log(msg);
  };

  // -- Already-seeded check ---------------------------------------------------
  const existingCount = await prisma.bloodGroup.count({
    where: { isDeleted: false },
  });

  if (existingCount > 0) {
    log(
      `⚠️  Partial seed detected (${existingCount}/${bloodGroups.length} blood groups found). Filling missing records...`,
    );
  } else {
    log("🩸 Seeding blood groups...");
  }

  // -- Insert missing records only --------------------------------------------
  let inserted = 0;
  let skipped = 0;

  for (const group of bloodGroups) {
    const existing = await prisma.bloodGroup.findUnique({
      where: { id: group.id },
    });

    if (existing) {
      await prisma.bloodGroup.update({
        where: { id: group.id },
        data: { groupName: group.groupName, isDeleted: false, deletedAt: null },
      });
      skipped++;
    } else {
      await prisma.bloodGroup.create({ data: group });
      inserted++;
    }
  }

  log(`   ✓ ${inserted} inserted, ${skipped} already existed`);
  log("\n✅ Blood group seeding complete!");
}

export { seedBloodGroups };

// -- Standalone execution (npx prisma db seed / npm run seed) -----------------
if (require.main === module) {
  seedBloodGroups(false)
    .catch((e) => {
      console.error("Seeder failed:", e.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
