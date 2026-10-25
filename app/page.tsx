import { HeroProvider } from "./components/HeroContext";
import { RoomProvider } from "./components/RoomContext";
import ScrollHero from "./components/ScrollHero";
import Opening from "./components/Opening";
import IconBar from "./components/IconBar";
import RoomDrawer from "./components/RoomDrawer";
import DashboardOverlay from "./components/DashboardOverlay";
import AboutSection from "./components/AboutSection";
import RoomsSection from "./components/RoomsSection";
import NowSection from "./components/NowSection";
import GuestbookSection from "./components/GuestbookSection";
import ClosingCTA from "./components/ClosingCTA";

export default function Page() {
  return (
    <RoomProvider>
      <HeroProvider>
        <main style={{ background: "#15100c" }}>
          <ScrollHero />
          <AboutSection />
          <RoomsSection />
          <NowSection />
          <GuestbookSection />
          <ClosingCTA />
        </main>
        <Opening />
        <IconBar />
        <RoomDrawer />
        <DashboardOverlay />
      </HeroProvider>
    </RoomProvider>
  );
}
