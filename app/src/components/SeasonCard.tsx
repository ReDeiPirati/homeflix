import Link from "next/link";
import Image from "next/image";

interface SeasonCardProps {
  collectionId: string;
  seasonNumber: number;
  poster?: string;
  episodeCount: number;
}

export default function SeasonCard({
  collectionId,
  seasonNumber,
  poster,
  episodeCount,
}: SeasonCardProps) {
  return (
    <Link
      href={`/c/${collectionId}/s/${seasonNumber}`}
      className="block relative group"
    >
      <div className="relative aspect-[2/3] rounded overflow-hidden bg-netflix-darkGray">
        {poster ? (
          <Image
            src={`/api/asset?path=${encodeURIComponent(poster)}`}
            alt={`Season ${seasonNumber}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 150px, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-netflix-lightGray">
            <span className="text-4xl font-bold">{seasonNumber}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      </div>
      <h3 className="mt-2 text-sm text-white">Season {seasonNumber}</h3>
      <p className="text-xs text-netflix-lightGray">{episodeCount} episodes</p>
    </Link>
  );
}
