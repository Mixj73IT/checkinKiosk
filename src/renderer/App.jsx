
import React, { useEffect, useState } from 'react';
import Kiosk from './components/Kiosk.jsx';
import Admin from './components/Admin.jsx';

export default function App(){
  const [cfg, setCfg] = useState(null);
  const [view, setView] = useState('kiosk');
  useEffect(() => { window.kiosk.getConfig().then(setCfg); }, []);
  if (!cfg) return <div className="screen">Loading…</div>;
  return (
    <div className={`screen theme-${cfg.ui.theme}`}>
      {view === 'kiosk' ? (
        <Kiosk cfg={cfg} goAdmin={() => setView('admin')} refreshCfg={() => window.kiosk.getConfig().then(setCfg)} />
      ) : (
        <Admin cfg={cfg} goKiosk={() => setView('kiosk')} refreshCfg={() => window.kiosk.getConfig().then(setCfg)} />
      )}
    </div>
  );
}
