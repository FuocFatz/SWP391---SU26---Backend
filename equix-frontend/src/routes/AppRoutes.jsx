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
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";

// New Pages
import SystemSettingsPage from "../pages/SystemSettingsPage";
import AuditLogsPage from "../pages/AuditLogsPage";
import UsersManagementPage from "../pages/UsersManagementPage";
import JockeysPage from "../pages/JockeysPage";
import JockeyDetailPage from "../pages/JockeyDetailPage";
import AchievementsPage from "../pages/AchievementsPage";
import HorseDetailPage from "../pages/HorseDetailPage";
import TournamentDetailPage from "../pages/TournamentDetailPage";
import PairingContractsPage from "../pages/PairingContractsPage";
import RewardsPage from "../pages/RewardsPage";
import BrowseRacesPage from "../pages/BrowseRacesPage";
import MyHorsesPage from "../pages/MyHorsesPage";

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
                    <Route path="/jockeys" element={<JockeysPage />} />
                    <Route path="/jockeys/:id" element={<JockeyDetailPage />} />
                    <Route path="/horses/:id" element={<HorseDetailPage />} />
                    <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
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
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/rewards" element={<RewardsPage />} />
                        <Route path="/achievements" element={<AchievementsPage />} />
                        <Route path="/pairing-contracts" element={<PairingContractsPage />} />
                        <Route path="/browse-races" element={<BrowseRacesPage />} />
                        <Route path="/my-horses" element={<MyHorsesPage />} />
                        
                        {/* ADMIN ONLY ROUTES */}
                        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                            <Route path="/system-settings" element={<SystemSettingsPage />} />
                            <Route path="/audit-logs" element={<AuditLogsPage />} />
                            <Route path="/users-management" element={<UsersManagementPage />} />
                        </Route>
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;