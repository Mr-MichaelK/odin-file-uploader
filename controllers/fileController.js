const { createFileInFolder } = require("../services");
const storageAdapter = require("../services/storage/localDiskAdapter.js");

async function postUploadFile(req, res) {
  const ownerId = req.user.id;
  const { folderId } = req.body;

  if (!req.file) {
    const error = new Error("Please select a file to upload.");
    error.status = 400;
    throw error;
  }

  await createFileInFolder({
    folderId,
    ownerId,
    fileData: req.file,
  });

  res.redirect(`/folders/${folderId}`);
}

async function getDownloadFile(req, res) {
  const fileId = req.params.id;
  const ownerId = req.user.id;

  const file = await fileService.getFile({ fileId, ownerId });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.name)}"`,
  );

  const stream = storageAdapter.getReadStream(file.path);
  stream.pipe(res);
}

async function postRenameFile(req, res) {
  const fileId = req.params.id;
  const ownerId = req.user.id;
  const { newName } = req.body;

  const updatedFile = await fileService.renameFile({
    fileId,
    ownerId,
    newName,
  });

  res.redirect(`/folders/${updatedFile.folderId}`);
}

async function postDeleteFile(req, res) {
  const fileId = req.params.id;
  const ownerId = req.user.id;

  const deletedFile = await fileService.deleteFile({ fileId, ownerId });

  res.redirect(`/folders/${deletedFile.folderId}`);
}

module.exports = {
  postUploadFile,
  getDownloadFile,
  postRenameFile,
  postDeleteFile,
};
