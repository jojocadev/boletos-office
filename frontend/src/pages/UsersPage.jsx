import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', block: '', room: '', email: '' });

  const fetchUsers = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(res => res.json())
    .then(() => {
      setForm({ name: '', block: '', room: '', email: '' });
      fetchUsers();
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja mesmo remover?")) {
      fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' })
        .then(() => fetchUsers());
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Locatários</h1>
        <p>Gerencie a base de dados de moradores para vinculação dos boletos</p>
      </div>

      <div className="glass-panel mb-4">
        <h3>Adicionar Novo Locatário</h3>
        <form onSubmit={handleAdd} className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="text-secondary text-sm">Nome Completo</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="João Silva" />
          </div>
          <div>
            <label className="text-secondary text-sm">Bloco</label>
            <input required value={form.block} onChange={e => setForm({...form, block: e.target.value})} placeholder="Ex: A" />
          </div>
          <div>
            <label className="text-secondary text-sm">Sala/Apto</label>
            <input required value={form.room} onChange={e => setForm({...form, room: e.target.value})} placeholder="Ex: 101" />
          </div>
          <div>
            <label className="text-secondary text-sm">E-mail</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@dominio.com" />
          </div>
        </form>
        <div className="mt-4 d-flex justify-end">
          <button className="btn btn-primary" onClick={handleAdd}>Salvar Locatário</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Bloco</th>
              <th>Sala</th>
              <th>E-mail</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.block}</td>
                <td>{u.room}</td>
                <td>{u.email}</td>
                <td>
                  <button className="btn btn-danger" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} onClick={() => handleDelete(u.id)}>Remover</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', color: 'var(--text-muted)'}}>Nenhum usuário cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
