// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@trust.org";

  // Set password in environment variable for production:
  const plainPassword =
    process.env.INIT_ADMIN_PASSWORD || "Admin@12345";

  const hashed = await bcrypt.hash(plainPassword, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
    },
  });

  console.log("Admin created:", email);
  console.log(" Password:", plainPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
