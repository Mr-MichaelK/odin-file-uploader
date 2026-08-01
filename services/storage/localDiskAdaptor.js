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

  getReadStream(filePath) {
    if (!existsSync(filePath)) {
      const error = new Error("File missing on disk storage.");
      error.status = 404;
      throw error;
    }
    return createReadStream(filePath);
  }

  async moveFile(oldPath, newPath) {
    try {
      const destDir = path.dirname(newPath);
      await fs.mkdir(destDir, { recursive: true });

      await fs.rename(oldPath, newPath);
      return { path: newPath };
    } catch (err) {
      console.error(
        `LocalDiskAdapter: Failed to move/rename file from ${oldPath} to ${newPath}`,
        err,
      );
      throw err;
    }
  }
}

module.exports = new LocalDiskAdapter();
