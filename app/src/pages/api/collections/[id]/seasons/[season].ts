import type { NextApiRequest, NextApiResponse } from "next";
import { getConfig, getConfigError } from "@/lib/config";
import type { Season, ApiError } from "@/types";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Season | ApiError>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed", message: "Only GET is supported" });
  }

  const { id, season } = req.query;

  if (typeof id !== "string" || typeof season !== "string") {
    return res.status(400).json({ error: "Bad request", message: "Invalid collection ID or season" });
  }

  const seasonNum = parseInt(season, 10);
  if (isNaN(seasonNum)) {
    return res.status(400).json({ error: "Bad request", message: "Season must be a number" });
  }

  const config = getConfig();

  if (!config) {
    const error = getConfigError() || "Config not loaded";
    return res.status(500).json({ error: "Config error", message: error });
  }

  const collection = config.collections.find((c) => c.id === id);

  if (!collection) {
    return res.status(404).json({ error: "Not found", message: `Collection "${id}" not found` });
  }

  const seasonData = collection.seasons?.find((s) => s.number === seasonNum);

  if (!seasonData) {
    return res.status(404).json({ error: "Not found", message: `Season ${seasonNum} not found in "${id}"` });
  }

  return res.status(200).json(seasonData);
}
