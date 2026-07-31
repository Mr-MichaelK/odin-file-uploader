const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user ? req.user.id : "guest";

    const userDir = path.join(
      process.cwd(),
      "uploads",
      "users",
      String(userId),
    );

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },

  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const safeDiskName = `${uniquePrefix}-${file.originalname}`;

    cb(null, safeDiskName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;
