import {BrowserRouter, Routes, Route, Navigate,} from "react-router-dom";

import Header from './Header.jsx'
import HomeCard from './HomeCards.jsx';
import TodayArtworkSection from './TodaysArtworkSeaction.jsx';
import HomeGridCard from './HomeGridCard.jsx';
import SearchButton from './SearchButton.jsx'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './SearchPage.jsx';
import HomePage from './HomePage.jsx';
import DailyArtworkPage from './pages/dailyartworkpage/DailyArtworkPage.jsx';
import ArticlePage from './pages/articlepage/ArticlePage.jsx';
import ArtThreadsPage from './pages/artthreadspage/ArtThreadsPage.jsx';
import HowToUsePage from "./UserGuide_Section/HowToUsePage.jsx";

////////////////// New
import CanvasPage from "./Canvas_Workspace/Canvas_Board.jsx";
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
    return(
      
      <Router>
        <div>
          
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <CanvasPage/>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/DailyArtworkPage" element={<DailyArtworkPage />} />
            <Route path="/ArticlePage" element={<ArticlePage />} />
            <Route path="/ArtThreadsPage" element={<ArtThreadsPage />} />

            <Route
                path="/how-to-use"
                element={<HowToUsePage />}
            />
            
          </Routes>
        </div>
      </Router>
    );
}

export default App;