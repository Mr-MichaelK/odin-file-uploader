const userService = require("./userService");
const folderService = require("./folderService");
const fileService = require("./fileService");

module.exports = {
  ...userService,
  ...folderService,
  ...fileService,
};
