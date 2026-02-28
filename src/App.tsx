import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Article from './pages/Article';
import Service from './pages/Service';
import Datenschutz from './pages/Datenschutz';
import Impressum from './pages/Impressum';
import AGB from './pages/AGB';
import UeberMich from './pages/UeberMich';
import Admin from './pages/Admin';
import ConsentBanner from './components/ConsentBanner';
import { trackPageView } from './lib/analytics';

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

function App() {
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
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <ConsentBanner />
    </Router>
  );
}

export default App;
