import Link from "next/link";
import Image from "next/image";

interface EpisodeCardProps {
  collectionId: string;
  season: number;
  episode: number;
  title: string;
  thumbnail?: string;
}

export default function EpisodeCard({
  collectionId,
  season,
  episode,
  title,
  thumbnail,
}: EpisodeCardProps) {
  return (
    <Link
      href={`/watch/${collectionId}/${season}/${episode}`}
      className="block group"
    >
      <div className="relative aspect-video rounded overflow-hidden bg-netflix-darkGray">
        {thumbnail ? (
          <Image
            src={`/api/asset?path=${encodeURIComponent(thumbnail)}`}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 300px, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-netflix-lightGray bg-netflix-gray">
            <span className="text-2xl font-bold">
              E{String(episode).padStart(2, "0")}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-netflix-black ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <span className="text-xs text-netflix-lightGray">Episode {episode}</span>
        <h4 className="text-sm text-white group-hover:text-netflix-lightGray truncate">
          {title}
        </h4>
      </div>
    </Link>
  );
}
