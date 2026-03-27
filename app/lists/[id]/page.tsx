'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from '@/app/components/ThemeToggle';

type Person = { id: string; name: string; active: boolean };
type Category = { id: string; name: string; color: string | null; active: boolean };
type BaseItem = {
  id: string;
  name: string;
  categoryId: string | null;
  targetType: 'FAMILY' | 'PERSON';
  personId: string | null;
};
type Item = {
  id: string;
  name: string;
  checked: boolean;
  position: number;
  categoryId: string | null;
  personId: string | null;
  targetType: 'FAMILY' | 'PERSON';
  assigneeLabel: string;
};
type Group = {
  id: string | null;
  name: string;
  color: string;
  active: boolean;
  collapsed: boolean;
  items: Item[];
};

type ListData = {
  id: string;
  name: string;
  notes: string | null;
  progress: { total: number; completed: number; pending: number; percentage: number };
  categoryGroups: Group[];
  people: Person[];
  categories: Category[];
  baseItems: BaseItem[];
};

export default function ListDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newTargetType, setNewTargetType] = useState<'FAMILY' | 'PERSON'>('FAMILY');
  const [newPersonId, setNewPersonId] = useState('');
  const [baseItemId, setBaseItemId] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/lists/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  const allItems = useMemo(() => {
    if (!data) return [] as Item[];
    return data.categoryGroups.flatMap((g) => g.items).sort((a, b) => a.position - b.position);
  }, [data]);

  function itemVisible(item: Item) {
    if (statusFilter === 'pending' && item.checked) return false;
    if (statusFilter === 'completed' && !item.checked) return false;
    if (categoryFilter !== 'all' && (item.categoryId || 'uncategorized') !== categoryFilter) return false;

    const target = item.targetType === 'FAMILY' ? 'family' : item.personId || 'none';
    if (personFilter !== 'all' && target !== personFilter) return false;
    return true;
  }

  async function patchItem(itemId: string, payload: Record<string, unknown>) {
    await fetch(`/api/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await load();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await fetch(`/api/lists/${id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        categoryId: newCategoryId || null,
        targetType: newTargetType,
        personId: newTargetType === 'PERSON' ? newPersonId || null : null
      })
    });

    setNewName('');
    await load();
  }

  async function addFromBaseItem() {
    if (!baseItemId || !data) return;
    const base = data.baseItems.find((x) => x.id === baseItemId);
    if (!base) return;

    await fetch(`/api/lists/${id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: base.name,
        categoryId: base.categoryId,
        targetType: base.targetType,
        personId: base.targetType === 'PERSON' ? base.personId : null
      })
    });

    setBaseItemId('');
    await load();
  }

  async function deleteItem(itemId: string, itemName: string) {
    if (!window.confirm(`¿Eliminar el ítem "${itemName}"?`)) return;
    await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
    await load();
  }

  async function reorder(itemId: string, dir: -1 | 1) {
    const ids = allItems.map((x) => x.id);
    const idx = ids.indexOf(itemId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= ids.length) return;

    [ids[idx], ids[target]] = [ids[target], ids[idx]];

    await fetch(`/api/lists/${id}/items/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ids })
    });

    await load();
  }

  async function toggleCollapse(categoryId: string, collapsed: boolean) {
    await fetch(`/api/lists/${id}/categories/${categoryId}/collapse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collapsed })
    });
    await load();
  }

  async function editListMeta() {
    if (!data) return;
    const name = window.prompt('Nuevo nombre de lista', data.name);
    if (!name) return;
    const notes = window.prompt('Notas de lista', data.notes || '');

    await fetch(`/api/lists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, notes: notes || '' })
    });

    await load();
  }

  if (loading) {
    return <main className="container"><div className="card">Cargando lista...</div></main>;
  }

  if (!data) {
    return (
      <main className="container grid">
        <div className="card">Lista no encontrada.</div>
        <Link href="/lists"><button type="button">Volver</button></Link>
      </main>
    );
  }

  return (
    <main className="container grid" style={{ gap: '.8rem' }}>
      <section className="card row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>{data.name}</h1>
          <p className="muted" style={{ margin: 0 }}>{data.notes || 'Sin notas'}</p>
        </div>
        <div className="row">
          <Link href="/lists"><button className="ghost" type="button">Volver</button></Link>
          <Link href="/settings"><button className="ghost" type="button">Config</button></Link>
          <button className="ghost" type="button" onClick={editListMeta}>Editar lista</button>
          <ThemeToggle />
        </div>
      </section>

      <section className="card grid" style={{ gap: '.55rem' }}>
        <div className="row">
          <span className="badge">Total {data.progress.total}</span>
          <span className="badge">OK {data.progress.completed}</span>
          <span className="badge">Pendiente {data.progress.pending}</span>
          <span className="badge">{data.progress.percentage}%</span>
        </div>
        <div className="progress"><span style={{ width: `${data.progress.percentage}%` }} /></div>
      </section>

      <section className="card grid" style={{ gap: '.55rem' }}>
        <h3>Añadir ítem manual</h3>
        <form onSubmit={addItem} className="grid" style={{ gridTemplateColumns: '2fr 1.3fr 1fr 1.2fr auto' }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: Cargador móvil" required />
          <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={newTargetType} onChange={(e) => setNewTargetType(e.target.value as 'FAMILY' | 'PERSON')}>
            <option value="FAMILY">Toda la familia</option>
            <option value="PERSON">Persona</option>
          </select>
          <select value={newPersonId} onChange={(e) => setNewPersonId(e.target.value)} disabled={newTargetType !== 'PERSON'}>
            <option value="">Seleccionar</option>
            {data.people.filter((p) => p.id !== 'family-0').map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit">Añadir</button>
        </form>

        <div className="row">
          <select value={baseItemId} onChange={(e) => setBaseItemId(e.target.value)}>
            <option value="">Añadir desde ítem base...</option>
            {data.baseItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <button type="button" onClick={addFromBaseItem}>Insertar ítem base</button>
        </div>
      </section>

      <section className="card row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}>
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="completed">Completados</option>
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Todas las categorías</option>
          <option value="uncategorized">Sin categoría</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}>
          <option value="all">Todas las personas</option>
          <option value="family">Toda la familia</option>
          {data.people.filter((p) => p.id !== 'family-0').map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </section>

      {data.categoryGroups.map((group) => {
        const visibleItems = group.items.filter(itemVisible);
        if (visibleItems.length === 0 && statusFilter !== 'all') return null;
        if (visibleItems.length === 0 && categoryFilter !== 'all' && categoryFilter !== (group.id || 'uncategorized')) {
          return null;
        }

        const collapsed = group.id ? group.collapsed : false;

        return (
          <section key={group.id || 'uncategorized'} className="card grid" style={{ gap: '.55rem' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="row">
                <span className="badge" style={{ borderColor: group.color }}>{group.name}</span>
                {!group.active ? <span className="badge">Desactivada</span> : null}
              </div>
              {group.id ? (
                <button
                  type="button"
                  className="ghost small"
                  onClick={() => toggleCollapse(group.id as string, !collapsed)}
                >
                  {collapsed ? 'Expandir' : 'Colapsar'}
                </button>
              ) : null}
            </div>

            {!collapsed &&
              visibleItems.map((item) => {
                const idx = allItems.findIndex((x) => x.id === item.id);
                return (
                  <article
                    key={item.id}
                    className="row"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '.45rem .5rem',
                      background: item.checked ? 'var(--surface-2)' : 'transparent'
                    }}
                  >
                    <input
                      className="checkbox-big"
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => patchItem(item.id, { checked: !item.checked })}
                    />

                    <div className="space" style={{ minWidth: 160 }}>
                      <div style={{ textDecoration: item.checked ? 'line-through' : 'none', fontWeight: 600 }}>{item.name}</div>
                      <div className="muted" style={{ fontSize: '.85rem' }}>{item.assigneeLabel}</div>
                    </div>

                    <button type="button" className="ghost small" onClick={() => reorder(item.id, -1)} disabled={idx <= 0}>↑</button>
                    <button
                      type="button"
                      className="ghost small"
                      onClick={() => reorder(item.id, 1)}
                      disabled={idx < 0 || idx >= allItems.length - 1}
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      className="ghost small"
                      onClick={async () => {
                        const nextName = window.prompt('Editar ítem', item.name);
                        if (!nextName) return;
                        await patchItem(item.id, { name: nextName });
                      }}
                    >
                      Editar
                    </button>

                    <button type="button" className="danger small" onClick={() => deleteItem(item.id, item.name)}>Borrar</button>
                  </article>
                );
              })}
          </section>
        );
      })}
    </main>
  );
}
