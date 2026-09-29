import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { CalendarViewProvider } from "../context/CalendarViewContext";
import { PlanProvider } from "../context/PlanContext";

export default function Layout() {
  const location = useLocation();
  const isCalendarRoute = location.pathname === "/plan";

  return (
    <CalendarViewProvider>
      <PlanProvider>
        <div className="app-shell">
          <Sidebar />
          <main className={`main-content${isCalendarRoute ? " main-content-flush" : ""}`}>
            <Outlet />
          </main>
        </div>
      </PlanProvider>
    </CalendarViewProvider>
  );
}
