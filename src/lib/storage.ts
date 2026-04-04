import { ensureTable, getSetting } from "@/lib/db/integrations";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

interface StorageResult {
  url: string;
  storageType: "cloud" | "database";
}

async function getCloudConfig(): Promise<{ endpoint: string; bucket: string; accessKey: string; secretKey: string; publicUrl: string } | null> {
  try {
    await ensureTable();
    const endpoint = await getSetting("storage_endpoint");
    const bucket = await getSetting("storage_bucket");
    const accessKey = await getSetting("storage_access_key");
    const secretKey = await getSetting("storage_secret_key");
    const publicUrl = await getSetting("storage_public_url");
    if (endpoint && bucket && accessKey && secretKey) {
      return { endpoint, bucket, accessKey, secretKey, publicUrl: publicUrl || `${endpoint}/${bucket}` };
    }
  } catch {}
  return null;
}

export async function uploadAudio(audioData: string, fileName?: string): Promise<StorageResult> {
  const config = await getCloudConfig();

  if (config) {
    // Upload to S3-compatible storage
    const key = `audio/${nanoid()}/${fileName || "audio.webm"}`;
    const binaryData = Buffer.from(audioData, "base64");

    // Build S3 PUT request with simple auth
    const url = `${config.endpoint}/${config.bucket}/${key}`;
    const date = new Date().toUTCString();

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "audio/webm",
          "x-amz-date": date,
          "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
          Authorization: `AWS ${config.accessKey}:${config.secretKey}`,
        },
        body: binaryData,
      });

      if (res.ok) {
        return { url: `${config.publicUrl}/${key}`, storageType: "cloud" };
      }
    } catch {}
  }

  // Fallback: store in database
  const sql = getDb();
  const id = nanoid();
  await sql`CREATE TABLE IF NOT EXISTS audio_storage (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    content_type TEXT DEFAULT 'audio/webm',
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`INSERT INTO audio_storage (id, data, file_name) VALUES (${id}, ${audioData}, ${fileName || "audio.webm"})`;

  return { url: `/api/audio/${id}`, storageType: "database" };
}

export async function getAudioFromDb(id: string): Promise<{ data: string; contentType: string } | null> {
  const sql = getDb();
  const rows = await sql`SELECT data, content_type FROM audio_storage WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0] as { data: string; content_type: string };
  return { data: row.data, contentType: row.content_type };
}
