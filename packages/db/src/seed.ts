import { db } from "./client";
import { Course } from "./schema";

const courses = [
  {
    name: "Workplace Safety Hero",
    description:
      "A futuristic Australian worker in full PPE standing in a neon industrial site, symbolising core workplace health and safety training across construction, mining and heavy industry.",
    courseCode: "SAFE-101-AU",
    imageUrl: "/WorkplaceSafety.png",
    cost: "149.00",
    avgCompletionMinutes: 120,
    validityMonths: 24,
    tags: ["safety", "compliance", "construction", "mining"],
    tokenId: 1,
  },
  {
    name: "Food Safety & Hygiene Inspector",
    description:
      "A quality-control specialist in a clean lab coat surrounded by stylised food icons, representing HACCP principles, safe food handling and hygiene for hospitality and food production in Australia.",
    courseCode: "FOOD-201-AU",
    imageUrl: "/FoodSafety.png",
    cost: "129.00",
    avgCompletionMinutes: 90,
    validityMonths: 12,
    tags: ["safety", "compliance", "hospitality", "food"],
    tokenId: 2,
  },
  {
    name: "Fire Safety & Emergency Responder",
    description:
      "A firefighter in bright protective gear holding an extinguisher in front of stylised flames, symbolising fire safety, evacuation procedures and emergency response training for Australian workplaces.",
    courseCode: "FIRE-301-AU",
    imageUrl: "/FireSafety.png",
    cost: "99.00",
    avgCompletionMinutes: 60,
    validityMonths: 12,
    tags: ["safety", "emergency", "compliance"],
    tokenId: 3,
  },
  {
    name: "Cyber Security Guardian",
    description:
      "A digital guardian with neon visor and shield marked with a lock icon, representing cyber security awareness, phishing prevention and safe data handling for modern Australian businesses.",
    courseCode: "CYBER-101-AU",
    imageUrl: "/cyberGuardian.png",
    cost: "179.00",
    avgCompletionMinutes: 150,
    validityMonths: 12,
    tags: ["security", "compliance", "office", "technical"],
    tokenId: 4,
  },
  {
    name: "First Aid Responder",
    description:
      "A calm first aid professional holding a glowing medical kit, symbolising basic life support, incident response and first aid responsibilities in the workplace.",
    courseCode: "FIRSTAID-101-AU",
    imageUrl: "/FirstAid.png",
    cost: "199.00",
    avgCompletionMinutes: 180,
    validityMonths: 12,
    tags: ["safety", "medical", "compliance"],
    tokenId: 5,
  },
  {
    name: "Machine & Equipment Trainer",
    description:
      "A friendly training robot gesturing toward holographic machinery, representing safe operation, lockout–tagout and maintenance procedures for plant and equipment.",
    courseCode: "MACH-201-AU",
    imageUrl: "/Machine.png",
    cost: "249.00",
    avgCompletionMinutes: 240,
    validityMonths: 24,
    tags: ["safety", "technical", "manufacturing"],
    tokenId: 6,
  },
  {
    name: "Environmental Sustainability Guardian",
    description:
      "An eco-themed futuristic figure with glowing Earth and recycling symbols, representing environmental responsibilities, waste reduction and sustainable practices in Australian workplaces.",
    courseCode: "ENV-101-AU",
    imageUrl: "/Environmental.png",
    cost: "119.00",
    avgCompletionMinutes: 90,
    validityMonths: 36,
    tags: ["environmental", "compliance", "sustainability"],
    tokenId: 7,
  },
  {
    name: "Hazardous Chemicals & Dangerous Goods Specialist",
    description:
      "A worker in a high-tech protective suit and respirator with a glowing biohazard emblem, symbolising safe handling, storage and emergency management of hazardous chemicals and dangerous goods.",
    courseCode: "CHEM-301-AU",
    imageUrl: "/Hazardous.png",
    cost: "279.00",
    avgCompletionMinutes: 210,
    validityMonths: 12,
    tags: ["safety", "compliance", "hazmat", "technical"],
    tokenId: 8,
  },
];

async function seed() {
  console.log("Seeding courses...");

  for (const course of courses) {
    await db
      .insert(Course)
      .values(course)
      .onConflictDoUpdate({
        target: Course.courseCode,
        set: {
          name: course.name,
          description: course.description,
          imageUrl: course.imageUrl,
          cost: course.cost,
          avgCompletionMinutes: course.avgCompletionMinutes,
          validityMonths: course.validityMonths,
          tags: course.tags,
          tokenId: course.tokenId,
        },
      });
    console.log(`  ✓ ${course.name}`);
  }

  console.log("Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
