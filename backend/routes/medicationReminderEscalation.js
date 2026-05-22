const express = require('express');

const router = express.Router();

function escalate(input = {}) {
  const reminders = input.reminders || [
    { person: 'Avery', medication: 'evening dose', missed_count: 2, minutes_late: 48, caregiver_ack: false },
    { person: 'Mina', medication: 'vitamin pack', missed_count: 0, minutes_late: 5, caregiver_ack: true },
  ];
  return {
    reminders: reminders.map((r) => {
      const score = Math.min(100, Number(r.missed_count) * 28 + Number(r.minutes_late) * 0.7 + (r.caregiver_ack ? -20 : 15));
      return { ...r, escalation_score: Math.round(score), action: score >= 70 ? 'call_caregiver' : score >= 40 ? 'push_family_alert' : 'soft_reminder' };
    }),
  };
}

router.get('/', (req, res) => res.json(escalate()));
router.post('/evaluate', (req, res) => res.json(escalate(req.body || {})));

module.exports = router;
