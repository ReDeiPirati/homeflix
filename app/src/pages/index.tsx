import { GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import CollectionCard from "@/components/CollectionCard";
import { getConfig } from "@/lib/config";
import type { Collection } from "@/types";

type CollectionSummary = Pick<Collection, "id" | "title" | "type" | "poster" | "backdrop">;

interface HomeProps {
  collections: CollectionSummary[];
  error?: string;
}

export default function Home({ collections, error }: HomeProps) {
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl text-netflix-red mb-4">Error</h1>
            <p className="text-netflix-lightGray">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const series = collections.filter((c) => c.type === "series");
  const movies = collections.filter((c) => c.type === "movie");

  return (
    <Layout>
      <div className="px-4 md:px-12 py-8 space-y-8">
        {series.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">TV Series</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {series.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  id={collection.id}
                  title={collection.title}
                  poster={collection.poster}
                  type={collection.type}
                />
              ))}
            </div>
          </section>
        )}

        {movies.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Movies</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {movies.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  id={collection.id}
                  title={collection.title}
                  poster={collection.poster}
                  type={collection.type}
                />
              ))}
            </div>
          </section>
        )}

        {collections.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-2xl text-white mb-4">No Collections</h1>
              <p className="text-netflix-lightGray">
                Add collections to your library.yml to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const config = getConfig();

  if (!config) {
    return {
      props: {
        collections: [],
        error: "Library configuration not loaded",
      },
    };
  }

  const collections: CollectionSummary[] = config.collections.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    poster: c.poster,
    backdrop: c.backdrop,
  }));

  return {
    props: {
      collections,
    },
  };
};
