import React, { useEffect, useState } from 'react';

// 🔗 Routes à tester
const ROUTES = [
  { path: '/', label: 'Accueil' },
  { path: '/home', label: 'Home' },
  { path: '/p/:slug', label: 'Profil (template)' },
  { path: '/p/max', label: 'Profil public "max"' },
];

export default function Diag() {
  const [routesResult, setRoutesResult] = useState<any[]>([]);
  const [styleReport, setStyleReport] = useState<any[]>([]);
  const [cleaned, setCleaned] = useState(false);

  // 🧭 Vérifie les routes principales
  useEffect(() => {
    async function checkRoutes() {
      const checks = await Promise.all(
        ROUTES.map(async ({ path, label }) => {
          try {
            const res = await fetch(path, { redirect: 'manual' });
            return {
              label,
              path,
              status: res.status || 'inconnu',
              redirected: res.type === 'opaqueredirect',
            };
          } catch (err) {
            return { label, path, status: '❌ Erreur', redirected: false };
          }
        })
      );
      setRoutesResult(checks);
    }
    checkRoutes();
  }, []);

  // 🎨 Analyse visuelle & styles
  useEffect(() => {
    const stylesheets = Array.from(document.styleSheets)
      .map(s => s.href || 'inline')
      .filter(Boolean);

    const backgrounds = Array.from(document.querySelectorAll('*'))
      .map(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') return { tag: el.tagName, bg };
        return null;
      })
      .filter(Boolean);

    const vars = Array.from(document.querySelectorAll(':root')).flatMap(el =>
      Object.entries(getComputedStyle(el))
        .filter(([k]) => k.startsWith('--plz-'))
        .map(([k, v]) => `${k}: ${v}`)
    );

    const blockers = Array.from(document.querySelectorAll('*')).filter(el => {
      const htmlEl = el as HTMLElement;
      const style = getComputedStyle(el);
      return (
        (style.position === 'fixed' || style.position === 'absolute') &&
        parseFloat(style.zIndex || '0') > 5 &&
        (style.backgroundColor.includes('pink') || style.background.includes('pink')) &&
        htmlEl.offsetWidth > 50 &&
        htmlEl.offsetHeight > 50
      );
    });

    setStyleReport([
      { label: 'CSS chargés', data: stylesheets },
      { label: 'Variables thème', data: vars },
      { label: 'Backgrounds détectés', data: backgrounds },
      { label: 'Calques bloquants', data: blockers.map(b => b.tagName) },
    ]);
  }, []);

  // 🧹 Auto-fix visuel (supprime anciens backgrounds / overflow / calques roses)
  const handleClean = () => {
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        (el as HTMLElement).style.backgroundImage = 'none';
      }
    });
    document.querySelectorAll('html, body, #root').forEach(el => {
      (el as HTMLElement).style.overflow = 'auto';
    });
    document.querySelectorAll('*').forEach(el => {
      const style = getComputedStyle(el);
      if (
        (style.backgroundColor.includes('pink') || style.background.includes('pink')) &&
        parseFloat(style.zIndex || '0') > 5
      ) {
        (el as HTMLElement).remove();
      }
    });
    setCleaned(true);
  };

  return (
    <div className="plz-diag">
      <h1>🧪 Diagnostic Pliiiz</h1>

      <h2>Routage</h2>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Chemin</th>
            <th>Status</th>
            <th>Redirection</th>
          </tr>
        </thead>
        <tbody>
          {routesResult.map(r => (
            <tr key={r.path}>
              <td>{r.label}</td>
              <td>{r.path}</td>
              <td>{r.status === 200 ? '✅ 200 OK' : r.status}</td>
              <td>{r.redirected ? '↪️ Oui' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Styles & Thème</h2>
      {styleReport.map(v => (
        <div key={v.label}>
          <h3>{v.label}</h3>
          <pre>{JSON.stringify(v.data, null, 2)}</pre>
        </div>
      ))}

      <button className="plz-clean" onClick={handleClean}>
        🧹 Nettoyer les styles conflictuels
      </button>
      {cleaned && <p style={{ color: 'lime' }}>✔️ Nettoyage appliqué.</p>}
    </div>
  );
}
