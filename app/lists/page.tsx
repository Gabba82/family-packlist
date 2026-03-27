'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from '@/app/components/ThemeToggle';

type ListSummary = {
  id: string;
  name: string;
  notes: string | null;
  progress: { total: number; completed: number; pending: number; percentage: number };
  updatedAt: string;
};

type Template = { id: string; name: string };

export default function ListsPage() {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState('');

  const sorted = useMemo(
    () => [...lists].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [lists]
  );

  async function load() {
    setLoading(true);
    const [l, b] = await Promise.all([fetch('/api/lists', { cache: 'no-store' }), fetch('/api/bootstrap')]);
    const listData = await l.json();
    const boot = await b.json();
    setLists(listData);
    setTemplates(boot.templates || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        notes: notes.trim() || null,
        templateId: templateId || null
      })
    });

    setName('');
    setNotes('');
    setTemplateId('');
    await load();
  }

  async function duplicateList(id: string) {
    await fetch(`/api/lists/${id}/duplicate`, { method: 'POST' });
    await load();
  }

  async function deleteList(id: string, title: string) {
    if (!window.confirm(`¿Borrar la lista "${title}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/lists/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <main className="container grid" style={{ gap: '1rem' }}>
      <section className="row card" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Listas de equipaje</h1>
          <p className="muted" style={{ margin: 0 }}>Gestión familiar multi-dispositivo</p>
        </div>
        <div className="row">
          <Link href="/settings">
            <button type="button" className="ghost">Configuración</button>
          </Link>
          <ThemeToggle />
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginBottom: '.7rem' }}>Nueva lista</h3>
        <form onSubmit={createList} className="grid" style={{ gridTemplateColumns: '2fr 2fr 1.5fr auto' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la lista" required />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales" />
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Sin plantilla</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button type="submit">Crear</button>
        </form>
      </section>

      <section className="grid" style={{ gap: '.7rem' }}>
        {loading && <div className="card">Cargando...</div>}
        {!loading && sorted.length === 0 && <div className="card">No hay listas todavía.</div>}

        {sorted.map((list) => (
          <article key={list.id} className="card grid" style={{ gap: '.6rem' }}>
            <div className="row">
              <Link href={`/lists/${list.id}`} className="space"><h3>{list.name}</h3></Link>
              <span className="badge">{list.progress.percentage}%</span>
            </div>

            <div className="progress">
              <span style={{ width: `${list.progress.percentage}%` }} />
            </div>

            <div className="row muted" style={{ fontSize: '.92rem' }}>
              <span>Total: {list.progress.total}</span>
              <span>Completados: {list.progress.completed}</span>
              <span>Pendientes: {list.progress.pending}</span>
            </div>

            {list.notes ? <div className="muted">{list.notes}</div> : null}

            <div className="row">
              <Link href={`/lists/${list.id}`}><button type="button">Abrir</button></Link>
              <button type="button" className="ghost" onClick={() => duplicateList(list.id)}>Duplicar</button>
              <button type="button" className="danger" onClick={() => deleteList(list.id, list.name)}>Borrar</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
