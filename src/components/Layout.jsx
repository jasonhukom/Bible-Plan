import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { CalendarViewProvider } from "../context/CalendarViewContext";

export default function Layout() {
  return (
    <CalendarViewProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </CalendarViewProvider>
  );
}
