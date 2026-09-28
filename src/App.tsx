import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Rescue from './pages/Rescue';
import MeshNetwork from './pages/MeshNetwork';
import SensorReports from './pages/SensorReports';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { useStore } from './store/useStore';

// Protected Route: Requires authenticated session, else redirects to /login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { admin } = useStore();
  const location = useLocation();

  if (!admin?.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Login Route: If already logged in, redirect to home
const PublicAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { admin } = useStore();

  if (admin?.authenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { theme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login barrier */}
        <Route 
          path="/login" 
          element={
            <PublicAuthRoute>
              <Login />
            </PublicAuthRoute>
          } 
        />

        {/* Protected Application Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="rescue" element={<Rescue />} />
          <Route path="reports" element={<SensorReports />} />
          <Route path="network" element={<MeshNetwork />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
