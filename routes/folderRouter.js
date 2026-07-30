const { Router } = require("express");
const folderRouter = Router();
const folderController = require("../controllers/folderController");
const { isAuth } = require("../middleware/auth");

folderRouter.use(isAuth);

folderRouter.get("/:id?", folderController.getFolder);

folderRouter.post("/create", folderController.postCreateFolder);
folderRouter.post("/rename", folderController.postRenameFolder);
folderRouter.post("/move", folderController.postMoveFolder);
folderRouter.post("/delete", folderController.postDeleteFolder);

module.exports = folderRouter;
