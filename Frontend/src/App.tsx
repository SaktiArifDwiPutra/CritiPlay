import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import Statistics from './pages/Statistics';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { authService } from './services/authService';
import AdminDashboard from './pages/AdminDashboard';
import GoogleCallback from './pages/GoogleCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';
import Library from './pages/Library';
import PublicProfilePage from './pages/PublicProfilePage';

// 2. Modifikasi ProtectedRoute untuk membungkus halaman dengan Navbar dan Footer
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const token = authService.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 px-4 sm:px-8 pb-12">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      {/* Hapus padding dari div utama agar Navbar bisa full-width */}
      <div className="min-h-screen bg-slate-950 font-sans">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><GameList /></ProtectedRoute>} />
          <Route path="/game/:id" element={<ProtectedRoute><GameDetail /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>
  }
/>
        </Routes>
      </div>
    </BrowserRouter>
  );
}