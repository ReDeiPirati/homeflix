import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "HomeFlix" }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-netflix-black text-white">
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-netflix-black/80 to-transparent">
          <nav className="flex items-center px-4 md:px-12 py-4">
            <Link href="/" className="text-netflix-red text-2xl md:text-3xl font-bold tracking-wider">
              HOMEFLIX
            </Link>
          </nav>
        </header>
        <main className="pt-16">{children}</main>
      </div>
    </>
  );
}
