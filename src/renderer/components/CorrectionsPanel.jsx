
import React, { useState } from 'react';
import dayjs from 'dayjs';
export default function CorrectionsPanel(){
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(null);
  const checkoutNow = async () => {
    const dateISO = dayjs().format('YYYY-MM-DD');
    const res = await window.kiosk.manualCheckout({ dateISO, studentId, adminId:'attendance', reason });
    setMsg(res?.ok ? 'Manual checkout recorded.' : (res?.message || 'Failed.'));
    setTimeout(()=>setMsg(null), 1500);
  };
  return (
    <section>
      <h2>Manual Correction (Checkout Now)</h2>
      <input placeholder="Student ID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
      <input placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
      <button onClick={checkoutNow}>Checkout</button>
      {msg && <p>{msg}</p>}
    </section>
  );
}
