import { RoomProvider } from "./components/RoomContext";
import { SceneProvider } from "./components/SceneContext";
import RoomStage from "./components/RoomStage";
import SpaceBar from "./components/SpaceBar";
import Caption from "./components/Caption";
import Opening from "./components/Opening";
import IconBar from "./components/IconBar";
import RoomDrawer from "./components/RoomDrawer";
import Panels from "./components/Panels";
import DashboardOverlay from "./components/DashboardOverlay";

/** One screen, no scrolling: the 3D house with the UI on top of it. */
export default function Page() {
  return (
    <RoomProvider>
      <SceneProvider>
        <main className="home">
          <RoomStage />
          <SpaceBar />
          <Caption />
        </main>
        <Opening />
        <IconBar />
        <RoomDrawer />
        <Panels />
        <DashboardOverlay />
      </SceneProvider>
    </RoomProvider>
  );
}
