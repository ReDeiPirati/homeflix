import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import VideoPlayer from "@/components/VideoPlayer";
import { getConfig } from "@/lib/config";
import type { MovieCollection } from "@/types";

interface MovieWatchPageProps {
  collection: Pick<MovieCollection, "id" | "title"> | null;
  error?: string;
}

export default function MovieWatchPage({
  collection,
  error,
}: MovieWatchPageProps) {
  const router = useRouter();

  if (error || !collection) {
    return (
      <Layout title="Not Found - HomeFlix">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl text-netflix-red mb-4">Error</h1>
            <p className="text-netflix-lightGray">{error || "Movie not found"}</p>
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
      <div className="min-h-screen bg-black">
        {/* Video Player */}
        <div className="relative w-full aspect-video max-h-[80vh]">
          <VideoPlayer collectionId={collection.id} isMovie />
        </div>

        {/* Movie Info */}
        <div className="px-4 md:px-12 py-6 bg-netflix-black">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-netflix-lightGray hover:text-white text-sm"
            >
              &larr; Back to Home
            </Link>
          </div>

          {/* Movie Details */}
          <h1 className="text-xl md:text-2xl font-bold">{collection.title}</h1>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<MovieWatchPageProps> = async (context) => {
  const { id } = context.params || {};

  if (typeof id !== "string") {
    return {
      props: {
        collection: null,
        error: "Invalid movie ID",
      },
    };
  }

  const config = getConfig();

  if (!config) {
    return {
      props: {
        collection: null,
        error: "Library configuration not loaded",
      },
    };
  }

  const collection = config.collections.find((c) => c.id === id);

  if (!collection) {
    return {
      props: {
        collection: null,
        error: `Movie "${id}" not found`,
      },
    };
  }

  if (collection.type !== "movie") {
    return {
      props: {
        collection: null,
        error: `"${id}" is not a movie`,
      },
    };
  }

  return {
    props: {
      collection: { id: collection.id, title: collection.title },
    },
  };
};
