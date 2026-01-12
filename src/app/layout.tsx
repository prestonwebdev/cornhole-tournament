import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://copperbend-cornhole.vercel.app"),
  title: "Cornhole Tournament",
  description: "Sign up and compete in our cornhole tournament",
  openGraph: {
    title: "Copperbend Cornhole Tournament",
    description: "Sign up and compete in our cornhole tournament",
    images: [
      {
        url: "/link-preview.png",
        width: 1200,
        height: 630,
        alt: "Copperbend Cornhole Tournament",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Copperbend Cornhole Tournament",
    description: "Sign up and compete in our cornhole tournament",
    images: ["/link-preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
