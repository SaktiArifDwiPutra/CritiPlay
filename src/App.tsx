import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';

export default function App() {
  return (
    <BrowserRouter>
      {/* Layout global pembungkus semua halaman */}
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <Routes>
          {/* Daftar rute URL */}
          <Route path="/" element={<GameList />} />
          <Route path="/game/:id" element={<GameDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}