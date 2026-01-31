import Link from "next/link";
import Image from "next/image";

interface CollectionCardProps {
  id: string;
  title: string;
  poster?: string;
}

export default function CollectionCard({ id, title, poster }: CollectionCardProps) {
  return (
    <Link
      href={`/c/${id}`}
      className="block relative group flex-shrink-0 w-[150px] md:w-[200px]"
    >
      <div className="relative aspect-[2/3] rounded overflow-hidden bg-netflix-darkGray">
        {poster ? (
          <Image
            src={`/api/asset?path=${encodeURIComponent(poster)}`}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 150px, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-netflix-lightGray">
            <span className="text-sm text-center px-2">{title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      </div>
      <h3 className="mt-2 text-sm text-netflix-lightGray group-hover:text-white truncate">
        {title}
      </h3>
    </Link>
  );
}
