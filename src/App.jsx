import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PlanPage from "./pages/PlanPage";
import BiblePage from "./pages/BiblePage";
import SavesPage from "./pages/SavesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import LicensesPage from "./pages/LicensesPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/plan" replace />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/bible" element={<BiblePage />} />
        <Route path="/bible/:translationId" element={<BiblePage />} />
        <Route path="/bible/:translationId/:bookId" element={<BiblePage />} />
        <Route path="/bible/:translationId/:bookId/:chapter" element={<BiblePage />} />
        <Route path="/saves" element={<SavesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/licenses" element={<LicensesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/plan" replace />} />
    </Routes>
  );
}
