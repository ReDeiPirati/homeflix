export interface Episode {
  id: string;
  title: string;
  season: number;
  episode: number;
  filename: string;
  thumbnail?: string;
  duration?: number;
}

export interface Season {
  number: number;
  episodes: Episode[];
  poster?: string;
}

interface CollectionBase {
  id: string;
  title: string;
  path: string;
  poster?: string;
  backdrop?: string;
  description?: string;
}

export interface SeriesCollection extends CollectionBase {
  type: "series";
  seasons: Season[];
}

export interface MovieCollection extends CollectionBase {
  type: "movie";
  filename: string;
}

export type Collection = SeriesCollection | MovieCollection;

export interface LibraryConfig {
  collections: Collection[];
}

export interface HealthStatus {
  status: "ok" | "error";
  configLoaded: boolean;
  mediaRoot: string;
  mediaRootExists: boolean;
  timestamp: string;
  error?: string;
}

export interface ApiError {
  error: string;
  message: string;
}
