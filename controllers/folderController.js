const {
  getFolder: getFolderFromDb,
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getBreadcrumbs,
  getChildFolders,
  getOrCreateRootFolder,
  getValidMoveDestinations,
} = require("../services");

async function getFolder(req, res) {
  const ownerId = req.user.id;
  const folderId = req.params.id;

  const rootFolder = await getOrCreateRootFolder(ownerId);

  let currentFolder;
  if (!folderId) {
    currentFolder = rootFolder;
  } else {
    currentFolder = await getFolderFromDb({ id: folderId, ownerId });
    if (!currentFolder) {
      const error = new Error("Folder not found or unauthorized access.");
      error.status = 404;
      throw error;
    }
  }

  const [folders, validDestinations, breadcrumbs] = await Promise.all([
    getChildFolders({ parentId: currentFolder.id, ownerId }),
    getValidMoveDestinations({ folderId: currentFolder.id, ownerId }),
    getBreadcrumbs(currentFolder.id, ownerId),
  ]);

  res.render("folders/show", {
    currentFolder,
    rootFolder,
    folders,
    validDestinations,
    files: currentFolder.files,
    breadcrumbs,
  });
}

async function postCreateFolder(req, res) {
  const userId = req.user.id;
  const { folderName, parentFolderId } = req.body;

  const parentId = parentFolderId ? parseInt(parentFolderId, 10) : null;

  if (!folderName || folderName.trim() === "") {
    return res.status(400).send("Folder name cannot be empty");
  }

  const folder = await createFolder({
    ownerId: userId,
    parentId,
    name: folderName.trim(),
  });

  if (!folder) {
    return res.status(500).send("Error creating folder");
  }

  const redirectUrl = parentId ? `/folders/${parentId}` : "/folders";
  res.redirect(redirectUrl);
}

async function postRenameFolder(req, res) {
  const userId = req.user.id;
  const { folderId, newName } = req.body;

  const parsedFolderId = parseInt(folderId, 10);

  if (isNaN(parsedFolderId) || !newName || newName.trim() === "") {
    return res.status(400).send("Invalid input data");
  }

  const updatedFolder = await renameFolder({
    id: parsedFolderId,
    ownerId: userId,
    newName: newName.trim(),
  });

  if (!updatedFolder) {
    return res.status(404).send("Folder not found or unauthorized");
  }

  res.redirect(`/folders/${updatedFolder.id}`);
}

async function postMoveFolder(req, res) {
  const userId = req.user.id;
  const { folderId, destinationFolderId } = req.body;

  const parsedFolderId = Number(folderId);
  const parsedDestId = Number(destinationFolderId);

  if (!parsedFolderId || !parsedDestId) {
    const error = new Error("Invalid folder IDs provided.");
    error.status = 400;
    throw error;
  }

  await moveFolder({
    folderId: parsedFolderId,
    ownerId: userId,
    destinationFolderId: parsedDestId,
  });

  res.redirect(`/folders/${parsedDestId}`);
}

async function postDeleteFolder(req, res) {
  const userId = req.user.id;
  const { folderId } = req.body;

  const parsedFolderId = parseInt(folderId, 10);

  if (isNaN(parsedFolderId)) {
    return res.status(400).send("Invalid folder ID.");
  }

  const folder = await deleteFolder({ id: parsedFolderId, ownerId: userId });

  if (!folder) {
    return res.status(404).send("Folder not found or unauthorized");
  }

  const redirectUrl = folder.parentId
    ? `/folders/${folder.parentId}`
    : "/folders";
  res.redirect(redirectUrl);
}

module.exports = {
  getFolder,
  postCreateFolder,
  postRenameFolder,
  postMoveFolder,
  postDeleteFolder,
};
