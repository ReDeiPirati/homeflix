import fs from "fs";
import { parse } from "yaml";
import { env } from "./env";
import type { LibraryConfig } from "@/types";

let cachedConfig: LibraryConfig | null = null;
let configError: string | null = null;
let watcherInitialized = false;

function loadConfig(): void {
  try {
    const configPath = env.LIBRARY_CONFIG;

    if (!fs.existsSync(configPath)) {
      configError = `Config file not found: ${configPath}`;
      cachedConfig = null;
      console.error(`[Config] ${configError}`);
      return;
    }

    const content = fs.readFileSync(configPath, "utf-8");
    cachedConfig = parse(content) as LibraryConfig;
    configError = null;
    console.log(`[Config] Loaded from ${configPath}`);
  } catch (err) {
    configError = err instanceof Error ? err.message : "Unknown error loading config";
    cachedConfig = null;
    console.error(`[Config] Error loading config: ${configError}`);
  }
}

function initWatcher(): void {
  if (watcherInitialized) return;

  const configPath = env.LIBRARY_CONFIG;

  // Only watch if file exists
  if (fs.existsSync(configPath)) {
    fs.watchFile(configPath, { interval: 1000 }, () => {
      console.log("[Config] File changed, reloading...");
      loadConfig();
    });
    watcherInitialized = true;
    console.log(`[Config] Watching ${configPath} for changes`);
  }
}

// Initialize on first import (server-side only)
if (typeof window === "undefined") {
  loadConfig();
  initWatcher();
}

export function getConfig(): LibraryConfig | null {
  return cachedConfig;
}

export function getConfigError(): string | null {
  return configError;
}

export function isConfigLoaded(): boolean {
  return cachedConfig !== null;
}
