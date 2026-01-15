
import React, { useState } from 'react';
import ExceptionsPanel from './ExceptionsPanel.jsx';
import RosterImport from './RosterImport.jsx';
import CorrectionsPanel from './CorrectionsPanel.jsx';
import ConfigEditor from './ConfigEditor.jsx';

export default function Admin({ cfg, goKiosk, refreshCfg }){
  const [tab, setTab] = useState('exceptions');
  return (
    <div className="admin-screen">
      <header>
        <h1>Admin</h1>
        <div className="tabs">
          <button onClick={()=>setTab('exceptions')}>Exceptions</button>
          <button onClick={()=>setTab('corrections')}>Corrections</button>
          <button onClick={()=>setTab('roster')}>Roster Import</button>
          <button onClick={()=>setTab('config')}>Config</button>
        </div>
        <button onClick={goKiosk}>Back to Kiosk</button>
      </header>
      <main>
        {tab==='exceptions' && <ExceptionsPanel />}
        {tab==='corrections' && <CorrectionsPanel />}
        {tab==='roster' && <RosterImport />}
        {tab==='config' && <ConfigEditor cfg={cfg} refreshCfg={refreshCfg} />}
      </main>
    </div>
  );
}
