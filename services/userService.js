const prisma = require("../db/prisma.js");

async function findUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

async function findUserById(id) {
  return await prisma.user.findUnique({
    where: { id: Number(id) },
  });
}

async function createUser({ email, hashedPassword }) {
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  await prisma.folder.create({
    data: {
      name: "Root",
      ownerId: user.id,
      url: `/uploads/users/${user.id}/`,
    },
  });

  return await prisma.user.findUnique({
    where: { id: user.id },
    include: { folders: true },
  });
}

async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id: Number(id) },
  });
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  deleteUser,
};
