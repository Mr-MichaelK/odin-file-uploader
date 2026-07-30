const {
  getFolder: getFolderFromDb,
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getBreadcrumbs,
} = require("../services");

async function getFolder(req, res) {
  const userId = req.user.id;
  const folderId = req.params.id ? parseInt(req.params.id, 10) : null;

  if (req.params.id && isNaN(folderId)) {
    return res.status(400).send("Invalid folder ID");
  }

  const folder = await getFolderFromDb({ id: folderId, ownerId: userId });

  if (!folder) {
    return res.status(404).send("Folder not found");
  }

  const breadcrumbs = await getBreadcrumbs({ folderId, ownerId: userId });

  res.render("folders/show", {
    folder,
    subfolders: folder.children,
    files: folder.files,
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

  const redirectUrl = parentId ? `/folders/${parentId}` : "/dashboard";
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

  const parsedFolderId = parseInt(folderId, 10);
  const parsedDestId = destinationFolderId
    ? parseInt(destinationFolderId, 10)
    : null;

  if (isNaN(parsedFolderId) || (destinationFolderId && isNaN(parsedDestId))) {
    return res.status(400).send("Invalid folder IDs provided.");
  }

  if (parsedFolderId === parsedDestId) {
    return res.status(400).send("Cannot move a folder into itself.");
  }

  const updatedFolder = await moveFolder({
    folderId: parsedFolderId,
    ownerId: userId,
    destinationFolderId: parsedDestId,
  });

  if (!updatedFolder) {
    return res.status(404).send("Folder not found or unauthorized");
  }

  const redirectUrl = parsedDestId ? `/folders/${parsedDestId}` : "/dashboard";
  res.redirect(redirectUrl);
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
    : "/dashboard";
  res.redirect(redirectUrl);
}

module.exports = {
  getFolder,
  postCreateFolder,
  postRenameFolder,
  postMoveFolder,
  postDeleteFolder,
};
