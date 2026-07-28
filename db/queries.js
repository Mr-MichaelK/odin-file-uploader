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

async function createUser({ email, hashedPassword }) {
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      folders: {
        create: {
          name: "Root",
        },
      },
    },
    include: {
      folders: true,
    },
  });

  return user;
}

async function deleteUser(id) {
  const deletedUser = await prisma.user.delete({
    where: { id },
  });

  return deletedUser;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  deleteUser,
};
