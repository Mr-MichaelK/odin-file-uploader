const { supabase } = require("../../config/supabase");
const { Readable } = require("stream");

class SupabaseStorageAdapter {
  constructor() {
    this.bucket = process.env.SUPABASE_BUCKET_NAME || "files";
  }

  async saveFile({ file, ownerId }) {
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const safeFileName = file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\.-]/g, "_");

    const storagePath = `users/${ownerId}/${uniquePrefix}-${safeFileName}`;

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("SupabaseStorageAdapter: saveFile error", error);
      throw error;
    }

    return {
      path: data.path,
    };
  }

  async deleteFile(filePath) {
    if (!filePath) return;

    const pathsToRemove = Array.isArray(filePath) ? filePath : [filePath];
    if (pathsToRemove.length === 0) return;

    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove(pathsToRemove);

      if (error) {
        console.error(`SupabaseStorageAdapter: Failed to delete files`, error);
      }
    } catch (err) {
      console.error(`SupabaseStorageAdapter: Failed to delete files`, err);
    }
  }

  async getReadStream(filePath) {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .download(filePath);

    if (error || !data) {
      const err = new Error("File missing on remote storage.");
      err.status = 404;
      throw err;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return Readable.from(buffer);
  }

  async moveFile(oldPath, newPath) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .move(oldPath, newPath);

      if (error) {
        console.error(
          `SupabaseStorageAdapter: Failed to move file from ${oldPath} to ${newPath}`,
          error,
        );
        throw error;
      }

      return { path: newPath };
    } catch (err) {
      console.error(
        `SupabaseStorageAdapter: Failed to move file from ${oldPath} to ${newPath}`,
        err,
      );
      throw err;
    }
  }
}

module.exports = new SupabaseStorageAdapter();
