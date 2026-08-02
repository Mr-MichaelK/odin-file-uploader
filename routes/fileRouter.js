const { Router } = require("express");
const upload = require("../config/multer.js");
const fileController = require("../controllers/fileController.js");

const fileRouter = Router();

fileRouter.post(
  "/upload",
  upload.single("file"),
  fileController.postUploadFile,
);
fileRouter.get("/:id/download", fileController.getDownloadFile);
fileRouter.post("/:id/rename", fileController.postRenameFile);
fileRouter.post("/:id/delete", fileController.postDeleteFile);
fileRouter.post("/:id/move", fileController.postMoveFile);

module.exports = fileRouter;
