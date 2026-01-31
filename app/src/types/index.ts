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

export interface Collection {
  id: string;
  title: string;
  type: "series" | "movie";
  path: string;
  poster?: string;
  backdrop?: string;
  description?: string;
  seasons?: Season[];
}

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
