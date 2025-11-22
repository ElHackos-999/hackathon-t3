import { sql } from "drizzle-orm";

import { db } from "./client";
import { User } from "./schema";

// Generate a random Ethereum-style wallet address
function generateWalletAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Generate random user data
function generateUsers(count: number) {
  const firstNames = [
    "James",
    "Emma",
    "Oliver",
    "Charlotte",
    "William",
    "Amelia",
    "Benjamin",
    "Mia",
    "Lucas",
    "Harper",
    "Henry",
    "Evelyn",
    "Alexander",
    "Abigail",
    "Mason",
    "Emily",
    "Ethan",
    "Elizabeth",
    "Jacob",
    "Sofia",
    "Michael",
    "Avery",
    "Daniel",
    "Ella",
    "Matthew",
    "Scarlett",
    "Aiden",
    "Grace",
    "Joseph",
    "Chloe",
    "Samuel",
    "Victoria",
    "David",
    "Riley",
    "Carter",
    "Aria",
    "Owen",
    "Lily",
    "Wyatt",
    "Aurora",
    "John",
    "Zoey",
    "Jack",
    "Penelope",
    "Luke",
    "Layla",
    "Jayden",
    "Nora",
    "Dylan",
    "Camila",
  ];

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
  ];

  const domains = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "proton.me",
    "icloud.com",
    "hotmail.com",
    "fastmail.com",
    "zoho.com",
  ];

  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName =
      firstNames[Math.floor(Math.random() * firstNames.length)]!;
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;
    const domain = domains[Math.floor(Math.random() * domains.length)]!;

    // 80% chance of having a name
    const hasName = Math.random() < 0.8;
    // 70% chance of having an email
    const hasEmail = Math.random() < 0.7;
    // 5% chance of being an admin
    const isAdmin = Math.random() < 0.09;

    users.push({
      walletAddress: generateWalletAddress(),
      name: hasName ? `${firstName} ${lastName}` : null,
      email: hasEmail
        ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`
        : null,
      role: isAdmin ? ("admin" as const) : ("user" as const),
    });
  }

  return users;
}

async function seedUsers() {
  console.log("Seeding 50 random users...");

  const users = generateUsers(50);

  for (const user of users) {
    await db
      .insert(User)
      .values(user)
      .onConflictDoUpdate({
        target: User.walletAddress,
        set: {
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: sql`now()`,
        },
      });
    console.log(`  ✓ ${user.name ?? user.walletAddress.slice(0, 10)}...`);
  }

  console.log("\nUser seeding complete!");
  console.log(`Total users seeded: ${users.length}`);
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("User seeding failed:", error);
    process.exit(1);
  });
