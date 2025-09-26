import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixPasswords() {
  console.log("🔧 Fixing password hashes...");

  // Hash the correct password
  const correctHash = await bcrypt.hash("demo123", 10);
  console.log("Generated hash:", correctHash);

  // Update all users with the correct hash
  const users = await prisma.user.findMany({
    where: { 
      email: { 
        in: ["admin@attendance.local", "teacher@attendance.local", "student@attendance.local"] 
      } 
    }
  });

  console.log("Found users:", users.map(u => ({ email: u.email, currentHash: u.passwordHash })));

  // Update passwords
  await prisma.user.updateMany({
    where: { email: "admin@attendance.local" },
    data: { passwordHash: correctHash }
  });

  await prisma.user.updateMany({
    where: { email: "teacher@attendance.local" },
    data: { passwordHash: correctHash }
  });

  await prisma.user.updateMany({
    where: { email: "student@attendance.local" },
    data: { passwordHash: correctHash }
  });

  console.log("✅ Password hashes updated successfully!");

  // Test the hash
  const testResult = await bcrypt.compare("demo123", correctHash);
  console.log("Hash test (should be true):", testResult);

  // Verify in database
  const updatedUsers = await prisma.user.findMany({
    where: { 
      email: { 
        in: ["admin@attendance.local", "teacher@attendance.local", "student@attendance.local"] 
      } 
    },
    select: { email: true, passwordHash: true }
  });

  console.log("Updated users:");
  for (const user of updatedUsers) {
    const isValid = await bcrypt.compare("demo123", user.passwordHash || "");
    console.log(`${user.email}: Hash valid = ${isValid}`);
  }
}

fixPasswords()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
