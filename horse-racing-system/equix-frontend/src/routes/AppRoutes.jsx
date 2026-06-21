import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PasswordResetPage from "../pages/PasswordResetPage";
import AboutPage from "../pages/AboutPage";
import TermsPage from "../pages/TermsPage";
import RacesPage from "../pages/RacesPage";
import RaceDetailPage from "../pages/RaceDetailPage";
import LeaderboardPage from "../pages/LeaderboardPage";
import NotificationsPage from "../pages/NotificationsPage";
import TestEndpointsPage from "../pages/TestEndpointsPage";
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import NotFoundPage from "../pages/NotFoundPage";

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
                    <Route path="/test" element={<TestEndpointsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Auth Routes (no layout wrapper — full-page) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<PasswordResetPage />} />

                {/* Dashboard Routes with Navbar + Sidebar */}
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/dashboard/*" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;