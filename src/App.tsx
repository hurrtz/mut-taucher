import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Article from './pages/Article';
import Service from './pages/Service';
import Datenschutz from './pages/Datenschutz';
import Impressum from './pages/Impressum';
import AGB from './pages/AGB';
import UeberMich from './pages/UeberMich';
import ConsentBanner from './components/ConsentBanner';
import { trackPageView } from './lib/analytics';

const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const CalendarTab = lazy(() => import('./admin/tabs/CalendarTab'));
const BookingsTab = lazy(() => import('./admin/tabs/BookingsTab'));
const TherapiesTab = lazy(() => import('./admin/tabs/TherapiesTab'));
const GroupsTab = lazy(() => import('./admin/tabs/GroupsTab'));
const PatientsTab = lazy(() => import('./admin/tabs/PatientsTab'));
const TemplatesTab = lazy(() => import('./admin/tabs/TemplatesTab'));
const WorkbookTab = lazy(() => import('./admin/tabs/WorkbookTab'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

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


function useBrandColors() {
  useEffect(() => {
    fetch('/api/branding/colors')
      .then(r => r.json())
      .then(data => {
        if (data.primaryColor) {
          document.documentElement.style.setProperty('--primary', data.primaryColor);
        }
      })
      .catch(() => {});
  }, []);
}

function App() {
  useBrandColors();
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ueber-mich" element={<UeberMich />} />
        <Route path="/leistungen/:slug" element={<Service />} />
        <Route path="/wissen/:slug" element={<Article />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/agb" element={<AGB />} />

        <Route path="/admin" element={<AdminSuspense><AdminLayout /></AdminSuspense>}>
          <Route index element={<Navigate to="kalender" replace />} />
          <Route path="kalender" element={<CalendarTab />} />
          <Route path="erstgespraeche" element={<BookingsTab />} />
          <Route path="einzel" element={<TherapiesTab />} />
          <Route path="gruppen" element={<GroupsTab />} />
          <Route path="kunden" element={<PatientsTab />} />
          <Route path="dokumente" element={<TemplatesTab />} />
          <Route path="arbeitsmappe" element={<WorkbookTab />} />
          <Route path="client/:id" element={<ClientDetail />} />
        </Route>

        <Route path="*" element={<AdminSuspense><NotFound /></AdminSuspense>} />
      </Routes>
      <ConsentBanner />
    </Router>
  );
}

export default App;
