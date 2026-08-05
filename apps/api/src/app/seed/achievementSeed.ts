import { AchievementThresholdType } from "@prisma/client";
import { prisma } from "../shared/prisma";

const achievementDefinitions = [
  {
    id: "bd000001-0000-4000-8000-000000000001",
    title: "1st Donation",
    description: "Completed the first verified blood donation.",
    icon: "droplet",
    thresholdType: AchievementThresholdType.VERIFIED_DONATIONS,
    thresholdValue: 1,
  },
  {
    id: "bd000002-0000-4000-8000-000000000002",
    title: "2 Donations",
    description: "Completed two verified blood donations.",
    icon: "droplets",
    thresholdType: AchievementThresholdType.VERIFIED_DONATIONS,
    thresholdValue: 2,
  },
  {
    id: "bd000003-0000-4000-8000-000000000003",
    title: "3 Donations",
    description: "Completed three verified blood donations.",
    icon: "award",
    thresholdType: AchievementThresholdType.VERIFIED_DONATIONS,
    thresholdValue: 3,
  },
  {
    id: "bd000004-0000-4000-8000-000000000004",
    title: "4 Donations",
    description: "Completed four verified blood donations.",
    icon: "trophy",
    thresholdType: AchievementThresholdType.VERIFIED_DONATIONS,
    thresholdValue: 4,
  },
] as const;

export const seedAchievements = async () => {
  for (const definition of achievementDefinitions) {
    await prisma.achievement.upsert({
      where: { id: definition.id },
      create: definition,
      update: {
        title: definition.title,
        description: definition.description,
        icon: definition.icon,
        thresholdType: definition.thresholdType,
        thresholdValue: definition.thresholdValue,
        active: true,
        isDeleted: false,
        deletedAt: null,
      },
    });
  }

  console.log(`✅ Seeded ${achievementDefinitions.length} achievement definitions.`);
};
