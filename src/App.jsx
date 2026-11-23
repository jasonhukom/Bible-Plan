import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import WindowTitlebar from "./components/WindowTitlebar/WindowTitlebar";
import StartupPlanPicker from "./components/StartupPlanPicker/StartupPlanPicker";
import { LuminessBot } from "./components/LuminessWidget";
import PlanPage from "./pages/PlanPage";
import BiblePage from "./pages/BiblePage";
import SavesPage from "./pages/SavesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import LicensesPage from "./pages/LicensesPage";
import ExtensionsPage from "./pages/Extensions";
import { deviceStorage } from "./lib/deviceStorage";

// Loaded on demand: it pulls in the bundled reading-plan CSVs, which the rest
// of the app only loads when a plan is generated.
const PlanningPage = lazy(() => import("./pages/PlanningPage"));

export default function App() {
  const navigate = useNavigate();

  async function handleStartupPlanSelect(_account, selectedPlan) {
    if (selectedPlan) {
      deviceStorage.saveActivePlan(selectedPlan);
    }
    navigate("/plan");
  }

  return (
    <>
      <WindowTitlebar />
      <StartupPlanPicker onSelect={handleStartupPlanSelect} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/plan" replace />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route
            path="/planning"
            element={
              <Suspense fallback={<p className="hint-text" style={{ padding: 24 }}>…</p>}>
                <PlanningPage />
              </Suspense>
            }
          />
          <Route path="/bible" element={<BiblePage />} />
          <Route path="/bible/:translationId" element={<BiblePage />} />
          <Route path="/bible/:translationId/:bookId" element={<BiblePage />} />
          <Route path="/bible/:translationId/:bookId/:chapter" element={<BiblePage />} />
          <Route path="/saves" element={<SavesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/extensions" element={<ExtensionsPage />} />
          <Route path="/licenses" element={<LicensesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/plan" replace />} />
      </Routes>
      <LuminessBot />
    </>
  );
}
