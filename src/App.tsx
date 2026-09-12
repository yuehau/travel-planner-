import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CollectionsPage from './pages/CollectionsPage';
import TripDetail from './pages/TripDetail';
import AuthPage from './pages/AuthPage';
import DemoRedirect from './pages/DemoRedirect';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<AuthPage mode="signin" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/demo" element={<DemoRedirect />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/trip/:tripId" element={<TripDetail />} />
              </Route>
            </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
