import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export default function AdminDashboard() {
  const [users, setUsers] = useState<unknown[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getAllUsers();
        setUsers(data);
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        }
        } finally {
        setIsLoading(false);
        }
    };
    fetchUsers();
  }, []);

  if (isLoading) return <div className="text-center p-10 font-bold text-slate-500">Memuat data admin...</div>;
  
  if (error) return (
    <div className="max-w-4xl mx-auto mt-10 bg-red-50 p-6 rounded-3xl border border-red-100 text-center text-red-600 font-bold shadow-sm">
      {error}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-6">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Dasbor Admin</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Nama Lengkap</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Email</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Role</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Jumlah Game</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800">{user.name}</td>
                <td className="p-4 text-slate-500 font-medium">{user.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-slate-600 font-bold">{user.games_count || 0} Game</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}