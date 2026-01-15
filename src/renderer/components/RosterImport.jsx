
import React, { useState } from 'react';
export default function RosterImport(){
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);
  const importCsv = async () => { const res = await window.kiosk.importRosterCsv(csv); setResult(res); };
  return (
    <section>
      <h2>Roster Import (CSV)</h2>
      <p>Columns: id,name,grade,status,token,default_cutoff,alert_pref,photo_path</p>
      <textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={10} />
      <button onClick={importCsv}>Import</button>
      {result && <pre>{JSON.stringify(result,null,2)}</pre>}
    </section>
  );
}
