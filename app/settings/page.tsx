'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from '@/app/components/ThemeToggle';

type Category = { id: string; name: string; color: string | null; position: number; active: boolean };
type Person = {
  id: string;
  name: string;
  role: string;
  ageLabel: string | null;
  active: boolean;
  position: number;
};
type BaseItem = {
  id: string;
  name: string;
  categoryId: string | null;
  personId: string | null;
  targetType: 'FAMILY' | 'PERSON';
  suggestedOnNewList: boolean;
  active: boolean;
  position: number;
  category?: Category | null;
  person?: Person | null;
};
type TemplateItem = {
  id: string;
  name: string;
  categoryId: string | null;
  personId: string | null;
  targetType: 'FAMILY' | 'PERSON';
  active: boolean;
  position: number;
};
type Template = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  position: number;
  items: TemplateItem[];
};

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [baseItems, setBaseItems] = useState<BaseItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');

  const [personName, setPersonName] = useState('');
  const [personRole, setPersonRole] = useState<'adult' | 'child'>('adult');
  const [personAgeLabel, setPersonAgeLabel] = useState('');

  const [baseName, setBaseName] = useState('');
  const [baseCategoryId, setBaseCategoryId] = useState('');
  const [baseTargetType, setBaseTargetType] = useState<'FAMILY' | 'PERSON'>('FAMILY');
  const [basePersonId, setBasePersonId] = useState('');
  const [baseSuggested, setBaseSuggested] = useState(true);

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [templateItemName, setTemplateItemName] = useState('');
  const [templateItemCategoryId, setTemplateItemCategoryId] = useState('');
  const [templateItemTargetType, setTemplateItemTargetType] = useState<'FAMILY' | 'PERSON'>('FAMILY');
  const [templateItemPersonId, setTemplateItemPersonId] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );
  const activePeople = useMemo(
    () => persons.filter((p) => p.active && p.id !== 'family-0'),
    [persons]
  );
  const adultCount = useMemo(() => activePeople.filter((p) => p.role === 'adult').length, [activePeople]);
  const childCount = useMemo(() => activePeople.filter((p) => p.role === 'child').length, [activePeople]);

  async function loadAll() {
    setLoading(true);
    const [c, p, b, t] = await Promise.all([
      fetch('/api/categories', { cache: 'no-store' }),
      fetch('/api/persons', { cache: 'no-store' }),
      fetch('/api/base-items', { cache: 'no-store' }),
      fetch('/api/templates', { cache: 'no-store' })
    ]);

    setCategories(await c.json());
    setPersons(await p.json());
    setBaseItems(await b.json());
    const templateData = await t.json();
    setTemplates(templateData);

    if (!selectedTemplateId && templateData.length > 0) {
      setSelectedTemplateId(templateData[0].id);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function reorder(path: string, ids: string[]) {
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ids })
    });
    await loadAll();
  }

  if (loading) {
    return <main className="container"><div className="card">Cargando configuración...</div></main>;
  }

  return (
    <main className="container grid" style={{ gap: '.8rem' }}>
      <section className="card row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Configuración</h1>
          <p className="muted" style={{ margin: 0 }}>Parametrización completa desde interfaz</p>
        </div>
        <div className="row">
          <Link href="/lists"><button type="button" className="ghost">Volver a listas</button></Link>
          <ThemeToggle />
        </div>
      </section>

      <section className="card grid" style={{ gap: '.6rem' }}>
        <h3>Categorías</h3>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newCategoryName.trim()) return;
            await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor.trim() || null })
            });
            setNewCategoryName('');
            setNewCategoryColor('');
            await loadAll();
          }}
        >
          <input placeholder="Nueva categoría" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
          <input placeholder="#2563eb" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} />
          <button type="submit">Crear</button>
        </form>

        {categories.map((cat, index) => (
          <article key={cat.id} className="row" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.45rem .5rem' }}>
            <span className="space"><strong>{cat.name}</strong> <span className="muted">{cat.color || ''}</span></span>
            <button type="button" className="ghost small" onClick={async () => {
              const name = window.prompt('Nombre de categoría', cat.name);
              if (!name) return;
              const color = window.prompt('Color (hex)', cat.color || '');
              await fetch(`/api/categories/${cat.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: color || null })
              });
              await loadAll();
            }}>Editar</button>
            <button type="button" className="ghost small" onClick={async () => {
              await fetch(`/api/categories/${cat.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !cat.active })
              });
              await loadAll();
            }}>{cat.active ? 'Desactivar' : 'Activar'}</button>
            <button
              type="button"
              className="ghost small"
              disabled={index === 0}
              onClick={() => {
                const ids = categories.map((x) => x.id);
                [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                reorder('/api/categories/reorder', ids);
              }}
            >↑</button>
            <button
              type="button"
              className="ghost small"
              disabled={index === categories.length - 1}
              onClick={() => {
                const ids = categories.map((x) => x.id);
                [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                reorder('/api/categories/reorder', ids);
              }}
            >↓</button>
          </article>
        ))}
      </section>

      <section className="card grid" style={{ gap: '.6rem' }}>
        <h3>Personas</h3>
        <div className="row">
          <span className="badge">Adultos activos: {adultCount}</span>
          <span className="badge">Niños activos: {childCount}</span>
          <span className="badge">Total activo: {activePeople.length}</span>
        </div>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!personName.trim()) return;
            await fetch('/api/persons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: personName.trim(),
                role: personRole,
                ageLabel: personRole === 'child' ? personAgeLabel.trim() || null : null
              })
            });
            setPersonName('');
            setPersonAgeLabel('');
            setPersonRole('adult');
            await loadAll();
          }}
        >
          <input placeholder="Nombre (ej: Niño 5 años)" value={personName} onChange={(e) => setPersonName(e.target.value)} />
          <select value={personRole} onChange={(e) => setPersonRole(e.target.value as 'adult' | 'child')}>
            <option value="adult">Adulto</option>
            <option value="child">Niño/a</option>
          </select>
          <input
            placeholder="Edad (opcional)"
            value={personAgeLabel}
            onChange={(e) => setPersonAgeLabel(e.target.value)}
            disabled={personRole !== 'child'}
          />
          <button type="submit">Añadir</button>
        </form>

        {persons.map((person) => (
          <article key={person.id} className="row" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.45rem .5rem' }}>
            <span className="space">
              {person.name} <span className="muted">({person.role}{person.ageLabel ? ` · ${person.ageLabel}` : ''})</span>
            </span>
            {person.id !== 'family-0' ? (
              <>
                <button type="button" className="ghost small" onClick={async () => {
                  const name = window.prompt('Nombre persona', person.name);
                  if (!name) return;
                  const role = window.prompt('Rol (adult|child)', person.role) || person.role;
                  const ageLabel = window.prompt('Edad (opcional)', person.ageLabel || '');
                  await fetch(`/api/persons/${person.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, role, ageLabel })
                  });
                  await loadAll();
                }}>Editar</button>
                <button type="button" className="ghost small" onClick={async () => {
                  await fetch(`/api/persons/${person.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: !person.active })
                  });
                  await loadAll();
                }}>{person.active ? 'Desactivar' : 'Activar'}</button>
                <button
                  type="button"
                  className="danger small"
                  onClick={async () => {
                    if (!window.confirm(`Desactivar "${person.name}"?`)) return;
                    await fetch(`/api/persons/${person.id}`, { method: 'DELETE' });
                    await loadAll();
                  }}
                >
                  Quitar
                </button>
              </>
            ) : null}
          </article>
        ))}
      </section>

      <section className="card grid" style={{ gap: '.6rem' }}>
        <h3>Ítems base</h3>
        <form
          className="grid"
          style={{ gridTemplateColumns: '2fr 1.4fr 1fr 1.2fr auto' }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!baseName.trim()) return;
            await fetch('/api/base-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: baseName.trim(),
                categoryId: baseCategoryId || null,
                targetType: baseTargetType,
                personId: baseTargetType === 'PERSON' ? basePersonId || null : null,
                suggestedOnNewList: baseSuggested
              })
            });
            setBaseName('');
            await loadAll();
          }}
        >
          <input placeholder="Nuevo ítem base" value={baseName} onChange={(e) => setBaseName(e.target.value)} />
          <select value={baseCategoryId} onChange={(e) => setBaseCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={baseTargetType} onChange={(e) => setBaseTargetType(e.target.value as 'FAMILY' | 'PERSON')}>
            <option value="FAMILY">Familia</option>
            <option value="PERSON">Persona</option>
          </select>
          <select value={basePersonId} onChange={(e) => setBasePersonId(e.target.value)} disabled={baseTargetType !== 'PERSON'}>
            <option value="">Seleccionar</option>
            {activePeople.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit">Crear</button>
          <label className="row" style={{ gridColumn: '1 / -1' }}>
            <input type="checkbox" checked={baseSuggested} onChange={(e) => setBaseSuggested(e.target.checked)} style={{ width: 18 }} />
            Sugerir en listas nuevas
          </label>
        </form>

        {baseItems.map((item, index) => (
          <article key={item.id} className="row" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.45rem .5rem' }}>
            <span className="space">
              <strong>{item.name}</strong>
              <span className="muted"> · {item.category?.name || 'Sin categoría'} · {item.targetType === 'FAMILY' ? 'Familia' : item.person?.name || 'Persona'}</span>
            </span>
            <button type="button" className="ghost small" onClick={async () => {
              const name = window.prompt('Nombre ítem base', item.name);
              if (!name) return;
              await fetch(`/api/base-items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              await loadAll();
            }}>Editar</button>
            <button type="button" className="ghost small" onClick={async () => {
              await fetch(`/api/base-items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestedOnNewList: !item.suggestedOnNewList })
              });
              await loadAll();
            }}>{item.suggestedOnNewList ? 'Quitar sugerido' : 'Sugerir'}</button>
            <button type="button" className="ghost small" onClick={async () => {
              await fetch(`/api/base-items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !item.active })
              });
              await loadAll();
            }}>{item.active ? 'Desactivar' : 'Activar'}</button>
            <button
              type="button"
              className="ghost small"
              disabled={index === 0}
              onClick={() => {
                const ids = baseItems.map((x) => x.id);
                [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                reorder('/api/base-items/reorder', ids);
              }}
            >↑</button>
            <button
              type="button"
              className="ghost small"
              disabled={index === baseItems.length - 1}
              onClick={() => {
                const ids = baseItems.map((x) => x.id);
                [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                reorder('/api/base-items/reorder', ids);
              }}
            >↓</button>
          </article>
        ))}
      </section>

      <section className="card grid" style={{ gap: '.6rem' }}>
        <h3>Plantillas</h3>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!templateName.trim()) return;
            await fetch('/api/templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: templateName.trim(), description: templateDescription.trim() || null })
            });
            setTemplateName('');
            setTemplateDescription('');
            await loadAll();
          }}
        >
          <input placeholder="Nueva plantilla" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
          <input placeholder="Descripción" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} />
          <button type="submit">Crear</button>
        </form>

        {templates.map((tpl, index) => (
          <article key={tpl.id} className="row" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.45rem .5rem' }}>
            <button
              type="button"
              className={selectedTemplateId === tpl.id ? '' : 'ghost'}
              onClick={() => setSelectedTemplateId(tpl.id)}
            >
              {tpl.name}
            </button>
            <span className="muted">{tpl.description || ''}</span>
            <div className="space" />
            <button type="button" className="ghost small" onClick={async () => {
              const name = window.prompt('Nombre plantilla', tpl.name);
              if (!name) return;
              const description = window.prompt('Descripción', tpl.description || '');
              await fetch(`/api/templates/${tpl.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: description || '' })
              });
              await loadAll();
            }}>Editar</button>
            <button type="button" className="ghost small" onClick={async () => {
              await fetch(`/api/templates/${tpl.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !tpl.active })
              });
              await loadAll();
            }}>{tpl.active ? 'Desactivar' : 'Activar'}</button>
            <button
              type="button"
              className="ghost small"
              disabled={index === 0}
              onClick={() => {
                const ids = templates.map((x) => x.id);
                [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                reorder('/api/templates/reorder', ids);
              }}
            >↑</button>
            <button
              type="button"
              className="ghost small"
              disabled={index === templates.length - 1}
              onClick={() => {
                const ids = templates.map((x) => x.id);
                [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                reorder('/api/templates/reorder', ids);
              }}
            >↓</button>
          </article>
        ))}

        {selectedTemplate ? (
          <div className="grid" style={{ gap: '.5rem', borderTop: '1px solid var(--border)', paddingTop: '.5rem' }}>
            <h4>Ítems de plantilla: {selectedTemplate.name}</h4>
            <form
              className="grid"
              style={{ gridTemplateColumns: '2fr 1.3fr 1fr 1.2fr auto' }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!templateItemName.trim()) return;
                await fetch(`/api/templates/${selectedTemplate.id}/items`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: templateItemName.trim(),
                    categoryId: templateItemCategoryId || null,
                    targetType: templateItemTargetType,
                    personId: templateItemTargetType === 'PERSON' ? templateItemPersonId || null : null
                  })
                });
                setTemplateItemName('');
                await loadAll();
              }}
            >
              <input value={templateItemName} onChange={(e) => setTemplateItemName(e.target.value)} placeholder="Ítem de plantilla" />
              <select value={templateItemCategoryId} onChange={(e) => setTemplateItemCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={templateItemTargetType} onChange={(e) => setTemplateItemTargetType(e.target.value as 'FAMILY' | 'PERSON')}>
                <option value="FAMILY">Familia</option>
                <option value="PERSON">Persona</option>
              </select>
              <select
                value={templateItemPersonId}
                onChange={(e) => setTemplateItemPersonId(e.target.value)}
                disabled={templateItemTargetType !== 'PERSON'}
              >
                <option value="">Seleccionar</option>
                {activePeople.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button type="submit">Añadir</button>
            </form>

            {selectedTemplate.items.map((item) => (
              <article key={item.id} className="row" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.45rem .5rem' }}>
                <span className="space">{item.name}</span>
                <button type="button" className="ghost small" onClick={async () => {
                  const name = window.prompt('Nombre del ítem', item.name);
                  if (!name) return;
                  await fetch(`/api/template-items/${item.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                  });
                  await loadAll();
                }}>Editar</button>
                <button type="button" className="ghost small" onClick={async () => {
                  await fetch(`/api/template-items/${item.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: !item.active })
                  });
                  await loadAll();
                }}>{item.active ? 'Desactivar' : 'Activar'}</button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
