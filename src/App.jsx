import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./Auth/LoginPage.jsx";
import ProtectedRoute from "./Auth/ProtectedRoute.jsx";
import Dashboard from "./Dashboard/Dashboard.jsx";
import CanvasBoard from "./Canvas_Workspace/Canvas_Board.jsx";
import HowToUsePage from "./UserGuide_Section/HowToUsePage.jsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/workspace/:canvasId"
                    element={
                        <ProtectedRoute>
                            <CanvasBoard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/help"
                    element={
                        <ProtectedRoute>
                            <HowToUsePage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;