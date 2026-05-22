import React, { useEffect, useState } from 'react';

export default function MedicationReminderEscalation() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/medication-reminder-escalation').then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div className="page">
      <h1>Medication Reminder Escalation</h1>
      <p>Escalates missed household medication reminders based on lateness and caregiver acknowledgement.</p>
      {data?.reminders?.map((r) => <section key={`${r.person}-${r.medication}`} className="card"><h2>{r.person}</h2><p>{r.medication}: {r.action} ({r.escalation_score})</p></section>)}
    </div>
  );
}
