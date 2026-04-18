import { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        onLogin();
      } else {
        setError(data.error || 'Acesso negado. Tente novamente.');
      }
    } catch (err) {
      setError('Falha ao conectar ao servidor. Verifique se o Back-End está online.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '1rem'
    }} className="animate-fade-in">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
          <Mail size={56} />
        </div>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>AutoBoleto</h1>
        <p className="text-secondary" style={{ marginBottom: '2.5rem', fontSize: '1.1rem' }}>Sessão Exclusiva para Administração</p>

        {error && (
          <div className="status-ERROR" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', width: '100%' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Digite a Senha Mestra..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '1rem', paddingBottom: '1rem', fontSize: '1.1rem' }}
              disabled={loading}
              autoFocus
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading || !password} style={{ padding: '1.2rem', fontSize: '1.1rem' }}>
            {loading ? <Loader2 size={24} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} /> : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
