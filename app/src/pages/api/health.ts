import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { env } from "@/lib/env";
import { isConfigLoaded, getConfigError } from "@/lib/config";
import type { HealthStatus } from "@/types";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      status: "error",
      configLoaded: false,
      mediaRoot: env.MEDIA_ROOT,
      mediaRootExists: false,
      timestamp: new Date().toISOString(),
      error: "Method not allowed",
    });
  }

  const mediaRootExists = fs.existsSync(env.MEDIA_ROOT);
  const configLoaded = isConfigLoaded();
  const configError = getConfigError();

  const status: HealthStatus = {
    status: configLoaded && mediaRootExists ? "ok" : "error",
    configLoaded,
    mediaRoot: env.MEDIA_ROOT,
    mediaRootExists,
    timestamp: new Date().toISOString(),
  };

  if (configError) {
    status.error = configError;
  } else if (!mediaRootExists) {
    status.error = `Media root not found: ${env.MEDIA_ROOT}`;
  }

  return res.status(status.status === "ok" ? 200 : 503).json(status);
}
