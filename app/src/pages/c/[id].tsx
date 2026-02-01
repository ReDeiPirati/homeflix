import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import SeasonCard from "@/components/SeasonCard";
import { getConfig } from "@/lib/config";
import type { Collection } from "@/types";

interface CollectionPageProps {
  collection: Collection | null;
  error?: string;
}

export default function CollectionPage({ collection, error }: CollectionPageProps) {
  const router = useRouter();

  if (error || !collection) {
    return (
      <Layout title="Not Found - HomeFlix">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl text-netflix-red mb-4">Error</h1>
            <p className="text-netflix-lightGray">{error || "Collection not found"}</p>
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
    <Layout title={`${collection.title} - HomeFlix`}>
      {/* Hero Section with Backdrop */}
      <div className="relative h-[40vh] md:h-[50vh]">
        {collection.backdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(/api/asset?path=${encodeURIComponent(collection.backdrop)})`,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-netflix-darkGray" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{collection.title}</h1>
          {collection.description && (
            <p className="text-netflix-lightGray max-w-2xl">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 md:px-12 py-8">
        {collection.type === "movie" ? (
          /* Movie: Play Button */
          <Link
            href={`/watch/movie/${collection.id}`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded hover:bg-white/80 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Link>
        ) : (
          /* Series: Seasons Grid */
          <>
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Seasons</h2>
            {collection.seasons.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {collection.seasons.map((season) => (
                  <SeasonCard
                    key={season.number}
                    collectionId={collection.id}
                    seasonNumber={season.number}
                    poster={season.poster}
                    episodeCount={season.episodes.length}
                  />
                ))}
              </div>
            ) : (
              <p className="text-netflix-lightGray">No seasons available.</p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<CollectionPageProps> = async (context) => {
  const { id } = context.params || {};

  if (typeof id !== "string") {
    return { props: { collection: null, error: "Invalid collection ID" } };
  }

  const config = getConfig();

  if (!config) {
    return { props: { collection: null, error: "Library configuration not loaded" } };
  }

  const collection = config.collections.find((c) => c.id === id);

  if (!collection) {
    return { props: { collection: null, error: `Collection "${id}" not found` } };
  }

  return { props: { collection } };
};
