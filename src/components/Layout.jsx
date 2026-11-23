import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import OSDownloadButton from "./OSDownloadButton/OSDownloadButton";
import AiSearch from "./AiSearch/AiSearch";
import { CalendarViewProvider } from "../context/CalendarViewContext";
import { PlanProvider } from "../context/PlanContext";

export default function Layout() {
  const location = useLocation();
  const isCalendarRoute = location.pathname === "/plan";
  const isBibleRoute = location.pathname.startsWith("/bible");

  return (
    <CalendarViewProvider>
      <PlanProvider>
        <div className="app-shell">
          <Sidebar />
          <main className={`main-content${isCalendarRoute ? " main-content-flush" : ""}${isBibleRoute ? " main-content-bible" : ""}`}>
            <div className="app-download-slot" style={{ position: "fixed", top: 10, right: 14, zIndex: 45 }}>
              <AiSearch />
              <OSDownloadButton />
            </div>
            <Outlet />
          </main>
        </div>
      </PlanProvider>
    </CalendarViewProvider>
  );
}
