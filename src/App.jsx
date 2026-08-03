import {BrowserRouter, Routes, Route, Navigate,} from "react-router-dom";

import LoginPage from "./Auth/LoginPage.jsx";
import ProtectedRoute from "./Auth/ProtectedRoute.jsx";
import Dashboard from "./Dashboard/Dashboard.jsx";
import CanvasBoard from "./Canvas_Workspace/Canvas_Board.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

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
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;