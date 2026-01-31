import type { NextApiRequest, NextApiResponse } from "next";
import { getConfig, getConfigError } from "@/lib/config";
import type { Collection, ApiError } from "@/types";

type CollectionSummary = Pick<Collection, "id" | "title" | "type" | "poster" | "backdrop">;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CollectionSummary[] | ApiError>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed", message: "Only GET is supported" });
  }

  const config = getConfig();

  if (!config) {
    const error = getConfigError() || "Config not loaded";
    return res.status(500).json({ error: "Config error", message: error });
  }

  const collections: CollectionSummary[] = config.collections.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    poster: c.poster,
    backdrop: c.backdrop,
  }));

  return res.status(200).json(collections);
}
