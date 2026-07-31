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

async function getOrCreateRootFolder(ownerId) {
  const numericOwnerId = Number(ownerId);

  let root = await prisma.folder.findFirst({
    where: {
      ownerId: numericOwnerId,
      parentId: null,
    },
  });

  if (!root) {
    root = await prisma.folder.create({
      data: {
        name: "Home",
        ownerId: numericOwnerId,
        parentId: null,
      },
    });
  }

  return root;
}

async function getChildFolders({ parentId, ownerId }) {
  return await prisma.folder.findMany({
    where: {
      ownerId: Number(ownerId),
      parentId: Number(parentId),
    },
    orderBy: {
      name: "asc",
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

  const [sourceFolder, destFolder] = await Promise.all([
    getFolder({ id: targetFolderId, ownerId }),
    getFolder({ id: targetDestId, ownerId }),
  ]);

  if (!sourceFolder || !destFolder) {
    throw new Error("Source or destination folder not found or unauthorized.");
  }

  const validDestinations = await getValidMoveDestinations({
    folderId: targetFolderId,
    ownerId,
  });
  const isValid = validDestinations.some((d) => d.id === targetDestId);

  if (!isValid) {
    throw new Error("Cannot move a folder into one of its own subfolders.");
  }

  return await prisma.folder.update({
    where: { id: targetFolderId },
    data: { parentId: targetDestId },
  });
}

async function getBreadcrumbs(folderId, ownerId) {
  const crumbs = [];
  let currentId = Number(folderId);
  const numericOwnerId = Number(ownerId);

  while (currentId) {
    const folder = await prisma.folder.findFirst({
      where: { id: currentId, ownerId: numericOwnerId },
      select: { id: true, name: true, parentId: true },
    });

    if (!folder) break;

    crumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return crumbs;
}

async function getValidMoveDestinations({ folderId, ownerId }) {
  const targetId = Number(folderId);

  const allFolders = await prisma.folder.findMany({
    where: { ownerId: Number(ownerId) },
    select: { id: true, name: true, parentId: true },
  });

  const childrenMap = new Map();
  for (const folder of allFolders) {
    if (folder.parentId) {
      if (!childrenMap.has(folder.parentId)) {
        childrenMap.set(folder.parentId, []);
      }
      childrenMap.get(folder.parentId).push(folder.id);
    }
  }

  const descendantIds = new Set([targetId]);
  const queue = [targetId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = childrenMap.get(currentId) || [];
    for (const childId of children) {
      descendantIds.add(childId);
      queue.push(childId);
    }
  }

  return allFolders.filter((folder) => !descendantIds.has(folder.id));
}

module.exports = {
  getFolder,
  getOrCreateRootFolder,
  getChildFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  getBreadcrumbs,
  getValidMoveDestinations,
};
