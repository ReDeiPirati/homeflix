import fs from "fs";
import path from "path";
import { parse } from "yaml";
import { env } from "./env";
import type { LibraryConfig } from "@/types";

let cachedConfig: LibraryConfig | null = null;
let configError: string | null = null;
let watcherInitialized = false;

/**
 * Validates that all files referenced in the config actually exist on disk.
 * Logs warnings for missing files but doesn't fail the config load.
 */
function validateConfigFiles(config: LibraryConfig): void {
  const mediaRoot = env.MEDIA_ROOT;
  const missingFiles: string[] = [];

  console.log(`[Config] Validating files against MEDIA_ROOT: ${mediaRoot}`);

  for (const collection of config.collections) {
    const collectionPath = path.join(mediaRoot, collection.path);

    // Validate collection poster
    if (collection.poster) {
      const posterPath = path.join(mediaRoot, collection.poster);
      if (!fs.existsSync(posterPath)) {
        missingFiles.push(collection.poster);
      }
    }

    // Validate collection backdrop
    if (collection.backdrop) {
      const backdropPath = path.join(mediaRoot, collection.backdrop);
      if (!fs.existsSync(backdropPath)) {
        missingFiles.push(collection.backdrop);
      }
    }

    // Type-specific validation
    if (collection.type === "series") {
      // Validate seasons
      for (const season of collection.seasons) {
        // Validate season poster
        if (season.poster) {
          const seasonPosterPath = path.join(mediaRoot, season.poster);
          if (!fs.existsSync(seasonPosterPath)) {
            missingFiles.push(season.poster);
          }
        }

        // Validate episodes
        for (const episode of season.episodes) {
          // Validate episode file
          const episodePath = path.join(
            collectionPath,
            `Season ${String(episode.season).padStart(2, "0")}`,
            episode.filename
          );
          if (!fs.existsSync(episodePath)) {
            missingFiles.push(`${collection.path}/Season ${String(episode.season).padStart(2, "0")}/${episode.filename}`);
          }

          // Validate episode thumbnail
          if (episode.thumbnail) {
            const thumbnailPath = path.join(mediaRoot, episode.thumbnail);
            if (!fs.existsSync(thumbnailPath)) {
              missingFiles.push(episode.thumbnail);
            }
          }
        }
      }
    } else if (collection.type === "movie") {
      // Validate movie file
      const moviePath = path.join(collectionPath, collection.filename);
      if (!fs.existsSync(moviePath)) {
        missingFiles.push(`${collection.path}/${collection.filename}`);
      }
    }
  }

  // Report results
  if (missingFiles.length === 0) {
    console.log(`[Config] ✓ All ${countTotalFiles(config)} referenced files exist`);
  } else {
    console.warn(`[Config] ⚠ Warning: ${missingFiles.length} file(s) missing:`);
    missingFiles.forEach((file) => console.warn(`  - ${file}`));
  }
}

/**
 * Counts total number of files referenced in config for validation feedback
 */
function countTotalFiles(config: LibraryConfig): number {
  let count = 0;
  for (const collection of config.collections) {
    if (collection.poster) count++;
    if (collection.backdrop) count++;

    if (collection.type === "series") {
      for (const season of collection.seasons) {
        if (season.poster) count++;
        for (const episode of season.episodes) {
          count++; // episode file
          if (episode.thumbnail) count++;
        }
      }
    } else if (collection.type === "movie") {
      count++; // movie file
    }
  }
  return count;
}

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
    const parsedConfig = parse(content) as LibraryConfig;

    // Validate that referenced files exist
    validateConfigFiles(parsedConfig);

    cachedConfig = parsedConfig;
    configError = null;
    console.log(`[Config] Loaded ${parsedConfig.collections.length} collection(s) from ${configPath}`);
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
