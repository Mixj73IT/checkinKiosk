
import React, { useState } from 'react';
import dayjs from 'dayjs';
export default function ExceptionsPanel(){
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(null);
  const submit = async () => {
    const dateISO = dayjs().format('YYYY-MM-DD');
    const res = await window.kiosk.markExceptionToday({ dateISO, studentId, reason, adminId:'frontdesk' });
    setMsg(res?.ok ? 'Exception saved.' : 'Failed.');
    setTimeout(()=>setMsg(null),1500);
  };
  return (
    <section>
      <h2>Mark Exception (Today)</h2>
      <input placeholder="Student ID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
      <input placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
      <button onClick={submit}>Save</button>
      {msg && <p>{msg}</p>}
    </section>
  );
}
