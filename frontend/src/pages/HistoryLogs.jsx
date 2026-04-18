import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function HistoryLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/boletos`)
      .then(res => res.json())
      .then(data => {
        // Find sent and errored
        const filtered = data.filter(d => d.status === 'SENT' || d.status === 'ERROR');
        // Sort by sent_at desc (which is roughly just descending by ID since we pull descending)
        setLogs(filtered);
      })
      .catch(console.error);
  }, []);

  const exportToExcel = () => {
    const header = "ID,Status,Data/Hora de Envio,Locatário,E-mail,Arquivo Boleto,Erro\n";
    const csvContent = logs.map(log => {
      const date = log.sent_at ? new Date(log.sent_at).toLocaleString('pt-BR') : '-';
      const errorStr = (log.error_message || '').replace(/"/g, '""');
      return `${log.id},"${log.status}","${date}","${log.userName}","${log.userEmail}","${log.filename}","${errorStr}"`;
    }).join("\n");
    const blob = new Blob(["\ufeff" + header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Historico_Boletos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header d-flex justify-between align-center">
        <div>
          <h1>Histórico e Logs</h1>
          <p>Monitoramento detalhado dos resultados dos envios</p>
        </div>
        <button 
          className="btn btn-outline d-flex align-center gap-2" 
          onClick={exportToExcel}
          disabled={logs.length === 0}
        >
          <Download size={20} /> Baixar Relatório (Excel)
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Data/Hora de Envio</th>
              <th>Locatário (E-mail)</th>
              <th>Arquivo Boleto</th>
              <th>Info Complementar</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>
                  <span className={`status-badge status-${log.status}`}>{log.status}</span>
                </td>
                <td>{log.sent_at ? new Date(log.sent_at).toLocaleString('pt-BR') : '-'}</td>
                <td>{log.userName} <br/><span className="text-muted text-sm">{log.userEmail}</span></td>
                <td>{log.filename}</td>
                <td className="text-brand-danger" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.error_message || '--'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', color: 'var(--text-muted)'}}>Nenhum envio registrado até o momento.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
