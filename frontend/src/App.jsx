import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Users, UploadCloud, Mail, Clock, LogOut } from 'lucide-react';
import { useState } from 'react';
import './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import BoletoImport from './pages/BoletoImport';
import QueueManager from './pages/QueueManager';
import HistoryLogs from './pages/HistoryLogs';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('admin_auth') === 'true');

  const handleLogin = () => {
    localStorage.setItem('admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <h2><Mail className="text-brand-primary" /> AutoBoleto</h2>
          
          <nav className="mt-4">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Home size={20} /> Dashboard
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} /> Locatários
            </NavLink>
            <NavLink to="/import" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UploadCloud size={20} /> Importar Boletos
            </NavLink>
            <NavLink to="/sender" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Mail size={20} /> Fila de Envio
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Clock size={20} /> Histórico
            </NavLink>
          </nav>
          
          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
             <button 
                onClick={handleLogout} 
                className="btn btn-outline" 
                style={{ width: '100%', display: 'flex', gap: '0.5rem', color: 'var(--brand-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
             >
                <LogOut size={20} /> Sair do Sistema
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content glass-panel" style={{margin: '1.5rem', flex: 1}}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/import" element={<BoletoImport />} />
            <Route path="/sender" element={<QueueManager />} />
            <Route path="/history" element={<HistoryLogs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
