const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const uploadRoot = path.join(__dirname, "../../uploads");
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function safeSegment(value) {
  return String(value || "general")
    .replace(/[^a-z0-9_-]/gi, "-")
    .toLowerCase();
}

function localFileName(originalName, prefix) {
  const extension = path.extname(originalName || ".bin").toLowerCase();
  return `${safeSegment(prefix)}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
}

async function storeBuffer(buffer, folder, fileName, contentType) {
  const objectPath = `${safeSegment(folder)}/${fileName}`;

  if (supabase) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType,
        upsert: false,
      });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  const folderPath = path.join(uploadRoot, safeSegment(folder));
  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(path.join(folderPath, fileName), buffer);
  return `/uploads/${safeSegment(folder)}/${fileName}`;
}

async function storeUploadedFile(file, folder, prefix) {
  if (!file?.buffer) throw new Error("Uploaded file data is missing.");
  const fileName = localFileName(file.originalname, prefix);
  return storeBuffer(file.buffer, folder, fileName, file.mimetype);
}

module.exports = { storeUploadedFile, storeBuffer };
