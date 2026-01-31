import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { env } from "@/lib/env";
import { validatePath } from "@/lib/validatePath";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { path: assetPath } = req.query;

  if (typeof assetPath !== "string") {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  const filePath = validatePath(assetPath, env.MEDIA_ROOT);
  if (!filePath) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext];

  if (!mimeType) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  const stat = fs.statSync(filePath);

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Cache-Control", "public, max-age=86400");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
