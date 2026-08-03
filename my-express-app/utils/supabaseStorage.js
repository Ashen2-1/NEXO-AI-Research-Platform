import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "nexo-sources";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Supabase Storage is not configured.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const sanitizeFileName = (fileName = "") => {
  return String(fileName)
    .replace(/[^\w.\-()\s]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 160);
};

export const uploadFileToSupabaseStorage = async ({
  localFilePath,
  userId,
  canvasId = "default",
  originalName,
}) => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      fileUrl: "",
      storagePath: "",
      warning: "Supabase Storage is not configured.",
    };
  }

  const safeName = sanitizeFileName(originalName);
  const fileBuffer = await fs.readFile(localFilePath);

  const extension = path.extname(safeName).toLowerCase();
  const contentType =
    extension === ".pdf"
      ? "application/pdf"
      : "application/octet-stream";

  const storagePath = [
    String(userId),
    String(canvasId || "default"),
    `${Date.now()}-${safeName}`,
  ].join("/");

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  return {
    fileUrl: data.publicUrl,
    storagePath,
    warning: "",
  };
};