import type { NextApiRequest, NextApiResponse } from "next";
import { getConfig, getConfigError } from "@/lib/config";
import type { LibraryConfig, ApiError } from "@/types";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LibraryConfig | ApiError>
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

  return res.status(200).json(config);
}
