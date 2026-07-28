const prisma = require("./prisma.js");

async function findUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user;
}

async function findUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  return user;
}

module.exports = {
  findUserByEmail,
  findUserById,
};
