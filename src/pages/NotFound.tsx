import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 72, margin: 0, color: '#d1d5db' }}>404</h1>
        <p style={{ fontSize: 18, color: '#64748b', margin: '16px 0 24px' }}>Seite nicht gefunden</p>
        <Link to="/" style={{ color: '#2dd4bf', fontWeight: 500 }}>Zurück zur Startseite</Link>
      </div>
    </div>
  );
}
