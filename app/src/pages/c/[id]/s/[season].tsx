import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import EpisodeCard from "@/components/EpisodeCard";
import { getConfig } from "@/lib/config";
import type { Season, Collection } from "@/types";

interface SeasonPageProps {
  collection: Pick<Collection, "id" | "title"> | null;
  season: Season | null;
  error?: string;
}

export default function SeasonPage({ collection, season, error }: SeasonPageProps) {
  const router = useRouter();

  if (error || !collection || !season) {
    return (
      <Layout title="Not Found - HomeFlix">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl text-netflix-red mb-4">Error</h1>
            <p className="text-netflix-lightGray">{error || "Season not found"}</p>
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
    <Layout title={`${collection.title} - Season ${season.number} - HomeFlix`}>
      <div className="px-4 md:px-12 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-netflix-lightGray">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/c/${collection.id}`} className="hover:text-white">
            {collection.title}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Season {season.number}</span>
        </nav>

        <h1 className="text-2xl md:text-4xl font-bold mb-2">{collection.title}</h1>
        <h2 className="text-xl text-netflix-lightGray mb-8">
          Season {season.number} &bull; {season.episodes.length} Episodes
        </h2>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {season.episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              collectionId={collection.id}
              season={season.number}
              episode={episode.episode}
              title={episode.title}
              thumbnail={episode.thumbnail}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<SeasonPageProps> = async (context) => {
  const { id, season } = context.params || {};

  if (typeof id !== "string" || typeof season !== "string") {
    return { props: { collection: null, season: null, error: "Invalid parameters" } };
  }

  const seasonNum = parseInt(season, 10);
  if (isNaN(seasonNum)) {
    return { props: { collection: null, season: null, error: "Invalid season number" } };
  }

  const config = getConfig();

  if (!config) {
    return { props: { collection: null, season: null, error: "Library configuration not loaded" } };
  }

  const collection = config.collections.find((c) => c.id === id);

  if (!collection) {
    return { props: { collection: null, season: null, error: `Collection "${id}" not found` } };
  }

  if (collection.type !== "series") {
    return { props: { collection: null, season: null, error: `"${id}" is a movie, not a series` } };
  }

  const seasonData = collection.seasons.find((s) => s.number === seasonNum);

  if (!seasonData) {
    return {
      props: {
        collection: { id: collection.id, title: collection.title },
        season: null,
        error: `Season ${seasonNum} not found`,
      },
    };
  }

  return {
    props: {
      collection: { id: collection.id, title: collection.title },
      season: seasonData,
    },
  };
};
