import React from 'react';
import ActivityTimeline from '../components/customViews/ActivityTimeline';
import AmbientHeatmap from '../components/customViews/AmbientHeatmap';
import DailySummaryPDF from '../components/customViews/DailySummaryPDF';
import RoutineRulesEditor from '../components/customViews/RoutineRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Home Views</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>
          Custom dashboards for your smart home: activity, ambient sensors, daily PDF, and routine editor.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        <section>
          <ActivityTimeline />
        </section>
        <section>
          <AmbientHeatmap />
        </section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <section>
            <DailySummaryPDF />
          </section>
          <section>
            <RoutineRulesEditor />
          </section>
        </div>
      </div>
    </div>
  );
}
