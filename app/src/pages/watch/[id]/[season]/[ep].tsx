import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
import { getConfig } from "@/lib/config";
import type { Episode, Collection } from "@/types";

interface WatchPageProps {
  collection: Pick<Collection, "id" | "title"> | null;
  seasonNumber: number;
  episode: Episode | null;
  nextEpisode: { season: number; episode: number } | null;
  prevEpisode: { season: number; episode: number } | null;
  error?: string;
}

export default function WatchPage({
  collection,
  seasonNumber,
  episode,
  nextEpisode,
  prevEpisode,
  error,
}: WatchPageProps) {
  const router = useRouter();

  if (error || !collection || !episode) {
    return (
      <Layout title="Not Found - HomeFlix">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl text-netflix-red mb-4">Error</h1>
            <p className="text-netflix-lightGray">{error || "Episode not found"}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-netflix-red text-white rounded hover:bg-red-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${episode.title} - ${collection.title} - HomeFlix`}>
      <div className="min-h-screen bg-black">
        {/* Video Player */}
        <div className="relative w-full aspect-video max-h-[80vh]">
          <VideoPlayer
            collectionId={collection.id}
            season={seasonNumber}
            episode={episode.episode}
          />
        </div>

        {/* Episode Info */}
        <div className="px-4 md:px-12 py-6 bg-netflix-black">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/c/${collection.id}/s/${seasonNumber}`}
              className="text-netflix-lightGray hover:text-white text-sm"
            >
              &larr; Back to Season {seasonNumber}
            </Link>
            <div className="flex gap-4">
              {prevEpisode && (
                <Link
                  href={`/watch/${collection.id}/${prevEpisode.season}/${prevEpisode.episode}`}
                  className="px-4 py-2 bg-netflix-gray text-white rounded hover:bg-netflix-lightGray/30 text-sm"
                >
                  &larr; Previous
                </Link>
              )}
              {nextEpisode && (
                <Link
                  href={`/watch/${collection.id}/${nextEpisode.season}/${nextEpisode.episode}`}
                  className="px-4 py-2 bg-netflix-red text-white rounded hover:bg-red-700 text-sm"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Episode Details */}
          <h1 className="text-xl md:text-2xl font-bold">{episode.title}</h1>
          <p className="text-netflix-lightGray">
            {collection.title} &bull; S{String(seasonNumber).padStart(2, "0")}E
            {String(episode.episode).padStart(2, "0")}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<WatchPageProps> = async (context) => {
  const { id, season, ep } = context.params || {};

  if (typeof id !== "string" || typeof season !== "string" || typeof ep !== "string") {
    return {
      props: {
        collection: null,
        seasonNumber: 0,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: "Invalid parameters",
      },
    };
  }

  const seasonNum = parseInt(season, 10);
  const epNum = parseInt(ep, 10);

  if (isNaN(seasonNum) || isNaN(epNum)) {
    return {
      props: {
        collection: null,
        seasonNumber: 0,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: "Invalid season or episode number",
      },
    };
  }

  const config = getConfig();

  if (!config) {
    return {
      props: {
        collection: null,
        seasonNumber: 0,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: "Library configuration not loaded",
      },
    };
  }

  const collection = config.collections.find((c) => c.id === id);

  if (!collection) {
    return {
      props: {
        collection: null,
        seasonNumber: 0,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: `Collection "${id}" not found`,
      },
    };
  }

  if (collection.type !== "series") {
    return {
      props: {
        collection: null,
        seasonNumber: 0,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: `"${id}" is a movie, use /watch/movie/${id} instead`,
      },
    };
  }

  const seasonData = collection.seasons.find((s) => s.number === seasonNum);

  if (!seasonData) {
    return {
      props: {
        collection: { id: collection.id, title: collection.title },
        seasonNumber: seasonNum,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: `Season ${seasonNum} not found`,
      },
    };
  }

  const episode = seasonData.episodes.find((e) => e.episode === epNum);

  if (!episode) {
    return {
      props: {
        collection: { id: collection.id, title: collection.title },
        seasonNumber: seasonNum,
        episode: null,
        nextEpisode: null,
        prevEpisode: null,
        error: `Episode ${epNum} not found`,
      },
    };
  }

  // Find prev/next episodes
  const episodeIndex = seasonData.episodes.findIndex((e) => e.episode === epNum);
  let prevEpisode: { season: number; episode: number } | null = null;
  let nextEpisode: { season: number; episode: number } | null = null;

  if (episodeIndex > 0) {
    prevEpisode = {
      season: seasonNum,
      episode: seasonData.episodes[episodeIndex - 1].episode,
    };
  }

  if (episodeIndex < seasonData.episodes.length - 1) {
    nextEpisode = {
      season: seasonNum,
      episode: seasonData.episodes[episodeIndex + 1].episode,
    };
  }

  return {
    props: {
      collection: { id: collection.id, title: collection.title },
      seasonNumber: seasonNum,
      episode,
      nextEpisode,
      prevEpisode,
    },
  };
};
