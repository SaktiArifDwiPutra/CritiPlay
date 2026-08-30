import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import Statistics from './pages/Statistics'; 

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/stats" element={<Statistics />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}