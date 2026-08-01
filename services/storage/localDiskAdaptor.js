const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

class LocalDiskAdapter {
  async saveFile({ file, ownerId }) {
    const userDir = path.join(
      process.cwd(),
      "uploads",
      "users",
      String(ownerId),
    );

    await fs.mkdir(userDir, { recursive: true });

    const uniquePrefix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const safeDiskName = `${uniquePrefix}-${file.originalname}`;
    const absolutePath = path.join(userDir, safeDiskName);

    await fs.writeFile(absolutePath, file.buffer);

    return {
      path: absolutePath,
    };
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(
          `LocalDiskAdapter: Failed to delete file at ${filePath}`,
          err,
        );
      }
    }
  }
}

module.exports = new LocalDiskAdapter();
