import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "tldraw/tldraw.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nimbus Whiteboard",
  description: "Visual idea capture — Mermaid diagrams — auto-deploy pipeline",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nimbus Whiteboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-nimbus-bg text-nimbus-text relative`}
      >
        {/* Parallax wallpaper · matches v2 dashboard aesthetic ·
            Whiteboard = ORANGE chakra engine. Wallpaper is a 2.5MB SVG that
            actually wraps a PNG; CSS keeps it pinned + dimmed so it never
            steals attention from the board grid or tldraw canvas above. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div
            style={{
              backgroundImage: "url(/nimbusphere_text_only_wallpaper.svg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.35,
              filter: "saturate(0.85)",
              transform: "scale(1.05)",
              width: "100%",
              height: "100%",
            }}
          />
          {/* Soft top→bottom gradient mask so the wallpaper fades into pure
              bg at the bottom — keeps the board cards crisp. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.0) 0%, rgba(10,10,10,0.35) 60%, rgba(10,10,10,0.9) 100%)",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
