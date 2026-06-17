import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import HorseListPage from "../pages/HorseListPage";

function AppRoutes() {

    return (
        <BrowserRouter>

            <Routes>

                <Route path="/" element={<HomePage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route path="/register" element={<RegisterPage />} />

                <Route path="/dashboard" element={<DashboardPage />} />

                <Route path="/horses" element={<HorseListPage />} />

            </Routes>

        </BrowserRouter>
    );
}

export default AppRoutes;