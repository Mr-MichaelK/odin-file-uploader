const prisma = require("../db/prisma.js");
const { getFolder } = require("./folderService.js");

async function getFileFromFolder({ fileId, folderId, ownerId }) {
  const folder = await getFolder({ id: folderId, ownerId });

  if (!folder) {
    throw new Error("Folder not found or unauthorized.");
  }

  return await prisma.file.findFirst({
    where: {
      id: Number(fileId),
      folderId: Number(folderId),
    },
  });
}

async function createFileInFolder({ folderId, ownerId, fileData }) {
  const folder = await getFolder({ id: folderId, ownerId });

  if (!folder) {
    throw new Error("Folder not found or unauthorized.");
  }

  return await prisma.file.create({
    data: {
      name: fileData.name,
      extension: fileData.extension,
      size: Number(fileData.size),
      url: fileData.url || `${folder.url}${fileData.name}`,
      folderId: Number(folderId),
    },
  });
}

async function renameFile({ fileId, folderId, ownerId, newName }) {
  const file = await getFileFromFolder({ fileId, folderId, ownerId });

  if (!file) {
    throw new Error("File not found or unauthorized.");
  }

  return await prisma.file.update({
    where: { id: Number(fileId) },
    data: { name: newName },
  });
}

async function moveFileToFolder({
  fileId,
  ownerId,
  originFolderId,
  destinationFolderId,
}) {
  const originFolder = await getFolder({ id: originFolderId, ownerId });
  if (!originFolder) {
    throw new Error("Origin folder not found or unauthorized.");
  }

  const destinationFolder = await getFolder({
    id: destinationFolderId,
    ownerId,
  });
  if (!destinationFolder) {
    throw new Error("Destination folder not found or unauthorized.");
  }

  const file = await getFileFromFolder({
    fileId,
    folderId: originFolderId,
    ownerId,
  });

  if (!file) {
    throw new Error("File not found or unauthorized.");
  }

  return await prisma.file.update({
    where: { id: Number(fileId) },
    data: {
      folderId: Number(destinationFolderId),
    },
  });
}

async function deleteFile({ fileId, folderId, ownerId }) {
  const file = await getFileFromFolder({ fileId, folderId, ownerId });

  if (!file) {
    throw new Error("File not found or unauthorized.");
  }

  return await prisma.file.delete({
    where: { id: Number(fileId) },
  });
}

module.exports = {
  getFileFromFolder,
  createFileInFolder,
  renameFile,
  moveFileToFolder,
  deleteFile,
};
