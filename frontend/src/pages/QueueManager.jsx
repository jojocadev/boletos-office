import { useState, useEffect } from 'react';
import { Settings, PlayCircle, Loader2, Mail, Lock } from 'lucide-react';

export default function QueueManager() {
  const [settings, setSettings] = useState({ subject: '', body: '', smtp_email: '', smtp_password: '', smtp_host: '', smtp_port: '' });
  const [status, setStatus] = useState({ isRunning: false, stats: {}, currentProcessing: null });

  useEffect(() => {
    // Carregar templates
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings`)
      .then(res => res.json())
      .then(data => setSettings({ 
        subject: data.subject || '', 
        body: data.body || '', 
        smtp_email: data.smtp_email || '', 
        smtp_password: data.smtp_password || '',
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || ''
      }))
      .catch(console.error);

    // Polling do status da fila
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sender/status`)
        .then(res => res.json())
        .then(data => setStatus(data))
        .catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const saveSettings = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(() => alert('Configurações salvas!'));
  };

  const startQueue = () => {
    if (window.confirm("Isso adicionará todos os boletos vinculados à fila de envio. Tem certeza?")) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sender/start`, { method: 'POST' })
        .then(res => res.json())
        .then(data => alert(data.message));
    }
  };

  const totalLinked = status.stats.linked || 0;
  const inQueue = status.stats.queued || 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h1>Fila de Disparo</h1>
          <p>Configure os templates de e-mail e inicie o envio estruturado</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={startQueue} 
          disabled={status.isRunning || totalLinked === 0}
          style={{ padding: '1rem 2rem', fontSize: '1.2rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
        >
          <PlayCircle size={24} /> {status.isRunning ? 'Fila em Execução...' : 'Enviar Todos os Boletos'}
        </button>
      </div>

      <div className="d-flex gap-4">
        {/* Painel Esquerdo: Template */}
        <div className="glass-panel" style={{ flex: 2 }}>
          <h3 className="d-flex align-center gap-2 mb-4"><Settings size={20} /> Corpo Padrão (Template)</h3>
          
          <div className="mb-4">
            <label className="text-secondary text-sm">Assunto do E-mail</label>
            <input 
              value={settings.subject} 
              onChange={e => setSettings({...settings, subject: e.target.value})} 
            />
          </div>
          
          <div className="mb-4">
            <label className="text-secondary text-sm">Corpo do E-mail (Texto)</label>
            <textarea 
              rows="8" 
              value={settings.body} 
              onChange={e => setSettings({...settings, body: e.target.value})}
              placeholder="Olá {nome}, seu boleto da sala {sala}..."
            />
            <p className="text-muted text-sm mt-2">Dica: Use as tags {'{nome}'}, {'{bloco}'} e {'{sala}'} para mesclagem automática com os dados do locatário.</p>
          </div>

          <h3 className="d-flex align-center gap-2 mb-4 mt-4" style={{borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}><Mail size={20} /> Autenticação de Disparo (Gmail)</h3>
          
          <div className="mb-4 d-flex gap-4">
            <div style={{ flex: 2 }}>
              <label className="text-secondary text-sm">Servidor SMTP (Host)</label>
              <input 
                type="text"
                value={settings.smtp_host} 
                onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                placeholder="ex: smtp.gmail.com" 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-secondary text-sm">Porta SMTP</label>
              <input 
                type="text"
                value={settings.smtp_port} 
                onChange={e => setSettings({...settings, smtp_port: e.target.value})}
                placeholder="ex: 465 ou 587" 
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-secondary text-sm">E-mail do Remetente</label>
            <input 
              type="email"
              value={settings.smtp_email} 
              onChange={e => setSettings({...settings, smtp_email: e.target.value})}
              placeholder="ex: edificioofficecenter.df@gmail.com" 
            />
          </div>

          <div className="mb-4">
            <label className="text-secondary text-sm">Senha de App (16 dígitos originais)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password"
                value={settings.smtp_password} 
                onChange={e => setSettings({...settings, smtp_password: e.target.value})}
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Exemplo: xxxxxxxxxxxxxxxx" 
              />
            </div>
            <p className="text-muted text-sm mt-2">Insira sua Senha de App do Google do remetente. Salve para assumir controle dos envios.</p>
          </div>

          <div className="d-flex justify-end">
            <button className="btn btn-outline" onClick={saveSettings}>Salvar Configurações</button>
          </div>
        </div>

        {/* Painel Direito: Status */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 className="mb-4">Monitoramento da Fila</h3>
          
          <div className="stat-card mb-4 text-center">
            <h3>Boletos Prontos</h3>
            <div className="value">{totalLinked}</div>
          </div>
          
          <div className="stat-card mb-4 text-center" style={{ borderColor: 'var(--brand-warning)' }}>
            <h3 className="text-brand-warning">Na Fila (Aguardando)</h3>
            <div className="value text-brand-warning">{inQueue}</div>
          </div>

          <div className="stat-card text-center" style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <h3>Status do Servidor</h3>
            {status.isRunning ? (
              <div className="mt-4" style={{ color: 'var(--brand-success)' }}>
                <Loader2 size={36} className="lucide-spin" style={{ margin: '0 auto', animation: 'spin 2s linear infinite' }} />
                <p className="mt-2 text-sm font-bold">Enviando Ativamente...</p>
                {status.currentProcessing && (
                  <div className="mt-2 text-xs text-secondary" style={{ wordBreak: 'break-all' }}>
                    Processando ID {status.currentProcessing.id}: {status.currentProcessing.userEmail}
                  </div>
                )}
                <p className="mt-4 text-xs text-muted">Aguardando delay aleatório seguro 40s-60s.</p>
              </div>
            ) : (
               <div className="mt-4 text-muted">
                 <p>Ocioso</p>
               </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
