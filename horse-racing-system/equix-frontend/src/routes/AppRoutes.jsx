import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PasswordResetPage from "../pages/PasswordResetPage";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import FaqPage from "../pages/FaqPage";
import RacesPage from "../pages/RacesPage";
import RaceDetailPage from "../pages/RaceDetailPage";
import LeaderboardPage from "../pages/LeaderboardPage";
import NotificationsPage from "../pages/NotificationsPage";
import DashboardPage from "../pages/DashboardPage";
import DashboardSubroute from "./DashboardSubroute";
import ProfilePage from "../pages/ProfilePage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes with Navbar + Footer */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/races" element={<RacesPage />} />
                    <Route path="/races/:id" element={<RaceDetailPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Auth Routes (no layout wrapper — full-page) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<PasswordResetPage />} />

                {/* Authenticated dashboard routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/dashboard/:section" element={<DashboardSubroute />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
