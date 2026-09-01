import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import Statistics from './pages/Statistics';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';
import { authService } from './services/authService';
import AdminDashboard from './pages/AdminDashboard';
import GoogleCallback from './pages/GoogleCallback';

// 2. Modifikasi ProtectedRoute untuk membungkus halaman dengan Navbar
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const token = authService.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      <div className="px-4 sm:px-8 pb-12">
        {children}
      </div>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      {/* Hapus padding dari div utama agar Navbar bisa full-width */}
      <div className="min-h-screen bg-slate-50 font-sans">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><GameList /></ProtectedRoute>} />
          <Route path="/game/:id" element={<ProtectedRoute><GameDetail /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/google-callback" element={<GoogleCallback />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}