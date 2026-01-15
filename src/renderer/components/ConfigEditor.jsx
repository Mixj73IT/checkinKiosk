
import React, { useState } from 'react';
export default function ConfigEditor({ cfg, refreshCfg }){
  const [edit, setEdit] = useState(JSON.stringify(cfg, null, 2));
  const [msg, setMsg] = useState(null);
  const save = async () => {
    try { const updates = JSON.parse(edit); await window.kiosk.setConfig(updates); await refreshCfg(); setMsg('Saved.'); setTimeout(()=>setMsg(null),1500); }
    catch { setMsg('Invalid JSON'); }
  };
  return (
    <section>
      <h2>Configuration</h2>
      <textarea rows={20} value={edit} onChange={e=>setEdit(e.target.value)} />
      <button onClick={save}>Save</button>
      {msg && <p>{msg}</p>}
    </section>
  );
}
