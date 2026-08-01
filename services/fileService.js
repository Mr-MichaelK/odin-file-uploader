const prisma = require("../db/prisma.js");
const { getFolder } = require("./folderService.js");
const storageAdapter = require("./storage/localDiskAdapter.js");

async function getFile({ fileId, ownerId }) {
  const file = await prisma.file.findFirst({
    where: {
      id: Number(fileId),
      ownerId: Number(ownerId),
    },
  });

  if (!file) {
    const error = new Error("File not found or unauthorized access.");
    error.status = 404;
    throw error;
  }

  return file;
}

async function createFileInFolder({ folderId, ownerId, fileData }) {
  const targetFolderId = Number(folderId);
  const numericOwnerId = Number(ownerId);

  const folder = await getFolder({
    id: targetFolderId,
    ownerId: numericOwnerId,
  });

  if (!folder) {
    const error = new Error("Destination folder not found or unauthorized.");
    error.status = 404;
    throw error;
  }

  const existingFile = await prisma.file.findFirst({
    where: {
      name: fileData.originalname,
      folderId: targetFolderId,
    },
  });

  if (existingFile) {
    const error = new Error(
      `A file named "${fileData.originalname}" already exists in this folder.`,
    );
    error.status = 400;
    throw error;
  }

  const { path: storedPath } = await storageAdapter.saveFile({
    file: fileData,
    ownerId: numericOwnerId,
  });

  return await prisma.file.create({
    data: {
      name: fileData.originalname,
      size: Number(fileData.size),
      path: storedPath,
      ownerId: numericOwnerId,
      folderId: targetFolderId,
    },
  });
}

async function renameFile({ fileId, ownerId, newName }) {
  const file = await getFile({ fileId, ownerId });

  const duplicate = await prisma.file.findFirst({
    where: {
      name: newName,
      folderId: file.folderId,
      NOT: { id: file.id },
    },
  });

  if (duplicate) {
    const error = new Error(
      `A file named "${newName}" already exists in this folder.`,
    );
    error.status = 400;
    throw error;
  }

  return await prisma.file.update({
    where: { id: file.id },
    data: { name: newName },
  });
}

async function moveFileToFolder({ fileId, ownerId, destinationFolderId }) {
  const file = await getFile({ fileId, ownerId });
  const targetDestId = Number(destinationFolderId);

  const destinationFolder = await getFolder({ id: targetDestId, ownerId });
  if (!destinationFolder) {
    const error = new Error("Destination folder not found or unauthorized.");
    error.status = 404;
    throw error;
  }

  return await prisma.file.update({
    where: { id: file.id },
    data: { folderId: targetDestId },
  });
}

async function deleteFile({ fileId, ownerId }) {
  const file = await getFile({ fileId, ownerId });

  await prisma.file.delete({
    where: { id: file.id },
  });

  await storageAdapter.deleteFile(file.path);

  return file;
}

module.exports = {
  getFile,
  createFileInFolder,
  renameFile,
  moveFileToFolder,
  deleteFile,
};
