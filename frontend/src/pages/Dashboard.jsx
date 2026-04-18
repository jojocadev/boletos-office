import { useState, useEffect } from 'react';
import { Users, FileText, Send, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    queued: 0, sent: 0, error: 0, unlinked: 0, linked: 0, total: 0
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sender/status`)
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats({
            queued: data.stats.queued || 0,
            sent: data.stats.sent || 0,
            error: data.stats.error || 0,
            unlinked: data.stats.unlinked || 0,
            linked: data.stats.linked || 0,
            total: data.stats.total || 0,
          });
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema de boletos</p>
      </div>

      <div className="grid-cards">
        <div className="stat-card">
          <h3>Total de Boletos</h3>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Vinculados Prontos</h3>
          <div className="value text-brand-success">{stats.linked}</div>
        </div>
        <div className="stat-card">
          <h3>Enviados com Sucesso</h3>
          <div className="value text-brand-primary">{stats.sent}</div>
        </div>
        <div className="stat-card">
          <h3>Erros / Não Vinculados</h3>
          <div className="value text-brand-danger">{stats.error + stats.unlinked}</div>
        </div>
      </div>
    </div>
  );
}
