import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import PlanPage from "./pages/PlanPage";
import BiblePage from "./pages/BiblePage";
import SavesPage from "./pages/SavesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/plan" replace />} />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <PlanPage />
            </ProtectedRoute>
          }
        />
        <Route path="/bible" element={<BiblePage />} />
        <Route path="/bible/:translationId/:bookId/:chapter" element={<BiblePage />} />
        <Route
          path="/saves"
          element={
            <ProtectedRoute>
              <SavesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/plan" replace />} />
    </Routes>
  );
}
