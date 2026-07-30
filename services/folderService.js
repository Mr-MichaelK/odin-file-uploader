const prisma = require("../db/prisma.js");

async function getFolder({ id, ownerId }) {
  if (!id || !ownerId) return null;

  return await prisma.folder.findFirst({
    where: {
      id: Number(id),
      ownerId: Number(ownerId),
    },
  });
}

async function createFolder({ ownerId, parentId, name }) {
  const parentFolder = parentId
    ? await getFolder({ id: parentId, ownerId })
    : null;
  const baseUrl = parentFolder
    ? parentFolder.url
    : `/uploads/users/${ownerId}/`;
  const folderUrl = `${baseUrl}${name.toLowerCase().replace(/\s+/g, "-")}/`;

  return await prisma.folder.create({
    data: {
      name,
      ownerId: Number(ownerId),
      parentId: parentId ? Number(parentId) : null,
      url: folderUrl,
    },
  });
}

async function renameFolder({ id, ownerId, newName }) {
  const folder = await getFolder({ id, ownerId });

  if (!folder) {
    throw new Error("Folder not found or unauthorized.");
  }

  return await prisma.folder.update({
    where: { id: folder.id },
    data: { name: newName },
  });
}

async function deleteFolder({ id, ownerId }) {
  const folder = await getFolder({ id, ownerId });

  if (!folder) {
    throw new Error("Folder not found or unauthorized.");
  }

  if (folder.parentId === null) {
    throw new Error("Cannot delete the root folder.");
  }

  return await prisma.folder.delete({
    where: { id: folder.id },
  });
}

async function moveFolder({ folderId, ownerId, destinationFolderId }) {
  const targetFolderId = Number(folderId);
  const targetDestId = Number(destinationFolderId);

  if (targetFolderId === targetDestId) {
    throw new Error("Cannot move a folder into itself.");
  }

  return await prisma.folder.update({
    where: { id: targetFolderId },
    data: { parentId: targetDestId },
  });
}

async function getBreadcrumbs(folderId, ownerId) {
  const crumbs = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findFirst({
      where: { id: currentId, ownerId },
      select: { id: true, name: true, parentId: true },
    });

    if (!folder) break;

    crumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return crumbs;
}

module.exports = {
  getFolder,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  getBreadcrumbs,
};
