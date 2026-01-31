import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { env } from "@/lib/env";
import { validatePath } from "@/lib/validatePath";
import { getConfig } from "@/lib/config";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { collectionId, season, ep } = req.query;

  if (
    typeof collectionId !== "string" ||
    typeof season !== "string" ||
    typeof ep !== "string"
  ) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const libraryConfig = getConfig();
  if (!libraryConfig) {
    return res.status(500).json({ error: "Config not loaded" });
  }

  const collection = libraryConfig.collections.find((c) => c.id === collectionId);
  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }

  const seasonNum = parseInt(season, 10);
  const epNum = parseInt(ep, 10);

  if (isNaN(seasonNum) || isNaN(epNum)) {
    return res.status(400).json({ error: "Invalid season or episode number" });
  }

  const seasonData = collection.seasons?.find((s) => s.number === seasonNum);
  if (!seasonData) {
    return res.status(404).json({ error: "Season not found" });
  }

  const episode = seasonData.episodes.find((e) => e.episode === epNum);
  if (!episode) {
    return res.status(404).json({ error: "Episode not found" });
  }

  // Build the full file path
  const seasonFolder = `Season ${String(seasonNum).padStart(2, "0")}`;
  const relativePath = path.join(collection.path, seasonFolder, episode.filename);

  const filePath = validatePath(relativePath, env.MEDIA_ROOT);
  if (!filePath) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle Range requests for seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    // No range requested, send entire file
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
