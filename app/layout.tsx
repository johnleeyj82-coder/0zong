import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlayerProvider } from "./components/music/PlayerContext";
import MiniPlayer from "./components/music/MiniPlayer";
import ListenMode from "./components/music/ListenMode";

export const metadata: Metadata = {
  title: "0zong의 방",
  description: "취미와 공부를 전부 모아둔 3D 집. 물건을 누르면 그 취미의 기록이 나오고, 문을 열면 옆방으로 가요.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#15100c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600&family=Nanum+Myeongjo:wght@700;800&family=JetBrains+Mono:wght@400;500&family=Nanum+Brush+Script&family=Press+Start+2P&family=Gowun+Batang:wght@400;700&family=Black+Han+Sans&display=swap"
        />
      </head>
      <body>
        {/* The player lives here, above every page, so music keeps going between / and /movie. */}
        <PlayerProvider>
          {children}
          <MiniPlayer />
          <ListenMode />
        </PlayerProvider>
      </body>
    </html>
  );
}
