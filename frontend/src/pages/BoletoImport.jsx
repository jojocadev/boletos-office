import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';

export default function BoletoImport() {
  const [boletos, setBoletos] = useState([]);
  const [users, setUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/boletos`)
      .then(res => res.json())
      .then(data => setBoletos(data));

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`)
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('boletos', files[i]);
    }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/boletos/upload`, {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(() => {
      setIsUploading(false);
      fetchData();
    })
    .catch(console.error);
  };

  const handleManualLink = (boletoId, userId) => {
    fetch(`http://localhost:3001/api/boletos/${boletoId}/link`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    .then(() => fetchData());
  };
  
  const handleClearAll = () => {
    if(window.confirm('Certeza que deseja limpar todos os registros de boletos e seus status atuais da base?')) {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/boletos`, {
            method: 'DELETE'
        }).then(() => fetchData());
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header d-flex justify-between align-center">
        <div>
            <h1>Importação e Vinculação</h1>
            <p>Faça o upload dos PDFs e revise as vinculações automáticas</p>
        </div>
        <button className="btn btn-outline" onClick={handleClearAll}>Limpar Tabela</button>
      </div>

      <div className="glass-panel mb-4">
        <div className="dropzone">
          <UploadCloud size={48} className="text-brand-primary" style={{margin: '0 auto 1rem'}} />
          <h3>Arraste os boletos PDF aqui</h3>
          <p className="text-secondary mt-2 mb-4">Ou clique para selecionar de seu computador</p>
          <input 
            type="file" 
            multiple 
            accept="application/pdf"
            onChange={handleFileChange}
            id="file-upload"
            style={{display: 'none'}}
          />
          <button className="btn btn-primary" onClick={() => document.getElementById('file-upload').click()} disabled={isUploading}>
            {isUploading ? 'Processando...' : 'Selecionar Arquivos'}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Status</th>
              <th>Bloco/Sala Ext.</th>
              <th>Locatário Identificado</th>
              <th>Opções</th>
            </tr>
          </thead>
          <tbody>
            {boletos.map(b => (
              <tr key={b.id}>
                <td>{b.filename}</td>
                <td>
                  <span className={`status-badge status-${b.status}`}>{b.status}</span>
                </td>
                <td>{b.block ? `${b.block} / ${b.room}` : 'Não detectado'}</td>
                <td>
                  {b.userName ? (
                    <div className="d-flex align-center gap-2">
                      <CheckCircle size={16} className="text-brand-success" />
                      {b.userName} <span className="text-secondary">({b.userEmail})</span>
                    </div>
                  ) : (
                    <div className="d-flex align-center gap-2 text-brand-warning">
                      <AlertCircle size={16} />
                      Nenhum correspondente automático
                    </div>
                  )}
                </td>
                <td>
                  {b.status === 'UNLINKED' && (
                    <div className="d-flex align-center gap-2">
                        <select onChange={(e) => handleManualLink(b.id, e.target.value)} defaultValue="">
                        <option value="" disabled>Vincular a...</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} (B:{u.block} / S:{u.room})</option>
                        ))}
                        </select>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {boletos.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', color: 'var(--text-muted)'}}>Nenhum boleto importado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
