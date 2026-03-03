import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Article from './pages/Article';
import Service from './pages/Service';
import Datenschutz from './pages/Datenschutz';
import Impressum from './pages/Impressum';
import AGB from './pages/AGB';
import UeberMich from './pages/UeberMich';
import ConsentBanner from './components/ConsentBanner';
import { trackPageView } from './lib/analytics';

const Admin = lazy(() => import('./pages/Admin'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));

function AdminSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Laden...</div>
      </div>
    }>
      {children}
    </Suspense>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    queueMicrotask(() => trackPageView(pathname, document.title));

    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function WipOverlay() {
  if (new URLSearchParams(window.location.search).get('preview') === 'true') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🏗️</div>
        <h1 className="text-3xl font-serif font-bold text-text mb-4">
          Wir arbeiten an unserer Website
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Unsere Seite wird gerade überarbeitet und ist in Kürze wieder für Sie verfügbar.
          Vielen Dank für Ihre Geduld!
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <WipOverlay />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ueber-mich" element={<UeberMich />} />
        <Route path="/leistungen/:slug" element={<Service />} />
        <Route path="/wissen/:slug" element={<Article />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/agb" element={<AGB />} />
        <Route path="/admin" element={<AdminSuspense><Admin /></AdminSuspense>} />
        <Route path="/admin/client/:id" element={<AdminSuspense><ClientDetail /></AdminSuspense>} />
      </Routes>
      <ConsentBanner />
    </Router>
  );
}

export default App;
