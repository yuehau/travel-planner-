import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CollectionsPage from './pages/CollectionsPage';
import NewsPage from './pages/NewsPage';
import NewsPostPage from './pages/NewsPostPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import DemoRedirect from './pages/DemoRedirect';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { PageTransitionProvider } from './contexts/PageTransitionContext';

// The board pulls in React Flow and Leaflet, so it stays out of the main bundle.
const TripBoardPage = lazy(() => import('./pages/TripBoardPage'));
const SharedBoardPage = lazy(() => import('./pages/SharedBoardPage'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <PageTransitionProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<AuthPage mode="signin" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/demo" element={<DemoRedirect />} />
              <Route
                path="/shared/:token"
                element={(
                  <Suspense fallback={<LoadingSpinner label="Loading shared plan" fullScreen />}>
                    <SharedBoardPage />
                  </Suspense>
                )}
              />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsPostPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/trip/:tripId"
                  element={(
                    <Suspense fallback={<LoadingSpinner label="Loading Board" fullScreen />}>
                      <TripBoardPage />
                    </Suspense>
                  )}
                />
              </Route>
            </Routes>
          </PageTransitionProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
