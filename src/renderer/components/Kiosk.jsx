
import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc); dayjs.extend(timezone);

export default function Kiosk({ cfg, goAdmin }){
  const inputRef = useRef(null);
  const [scan, setScan] = useState('');
  const [feedback, setFeedback] = useState(null);
  const lastScanByToken = useRef(new Map());

  useEffect(() => {
    const i = setInterval(() => inputRef.current?.focus(), 800);
    return () => clearInterval(i);
  }, []);

  const beep = () => {
    if (!cfg.ui.beep) return;
    const url = window.kiosk.asset('beep.wav');
    const audio = new Audio(url); audio.play().catch(()=>{});
  };

  function submitScan(token, source='scanner'){
    const now = dayjs().tz(cfg.timezone);
    if (!token) return;
    const last = lastScanByToken.current.get(token) || 0;
    if (Date.now() - last < (cfg.scan.debounceSeconds * 1000)) return;
    lastScanByToken.current.set(token, Date.now());

    window.kiosk.lookupByToken(token).then(stu => {
      if (!stu) { setFeedback({ type:'error', msg:'ID NOT RECOGNIZED' }); beep(); setTimeout(()=>setFeedback(null), 2000); setScan(''); return; }
      const dateISO = now.format('YYYY-MM-DD');
      const payload = {
        studentId: stu.student_id,
        studentName: stu.name,
        source, note: null,
        stationId: cfg.stationId,
        dateISO,
        timestampISO: now.toISOString(),
        timezone: cfg.timezone
      };
      window.kiosk.addEvent(payload).then((res) => {
        setFeedback({ type:'success', msg: `✅ ${firstName(stu.name)} checked ${res.action}`, photo: stu.photo_path ? window.kiosk.assetFromPath(stu.photo_path) : null });
        beep(); setTimeout(()=>setFeedback(null), cfg.ui.photoPopupSeconds * 1000);
      }).catch(err => { setFeedback({ type:'error', msg: String(err) }); setTimeout(()=>setFeedback(null), 2000); });
    });
    setScan('');
  }

  return (
    <div className="kiosk">
      <header className="statusbar">
        <span className="brand">{cfg.schoolName}</span>
        <button className="admin" onClick={goAdmin}>Admin</button>
      </header>

      {feedback ? (
        <div className={`feedback ${feedback.type}`}>
          {feedback.photo && <img className="photo" src={feedback.photo} alt="" />}
          <h2>{feedback.msg}</h2>
        </div>
      ) : (
        <div className="idle">
          <div className="clock">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}</div>
          <p className="prompt">Scan your card</p>
        </div>
      )}

      <input ref={inputRef} type="password" className="hidden-input" value={scan}
             onChange={(e)=>setScan(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ submitScan(scan,'scanner'); } }} />
      <div className="manual">
        <input placeholder="Manual ID entry" value={scan} onChange={(e)=>setScan(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ submitScan(scan,'keyboard'); }}} />
        <button onClick={()=>submitScan(scan,'keyboard')}>Submit</button>
      </div>
    </div>
  );
}
function firstName(n){ return (n||'').split(' ')[0]; }
