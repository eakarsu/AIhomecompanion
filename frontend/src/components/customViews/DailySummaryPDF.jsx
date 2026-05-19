import React, { useState } from 'react';

export default function DailySummaryPDF() {
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    setStatus('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/daily-summary.pdf', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('PDF downloaded.');
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ margin: '0 0 4px' }}>Daily Activity Summary PDF</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
        Export a printable summary of today's device events, automations, and AI recommendations.
      </p>
      <button
        onClick={downloadPDF}
        disabled={downloading}
        style={{
          padding: '8px 16px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: downloading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {downloading ? 'Generating PDF...' : 'Download Daily Summary PDF'}
      </button>
      {status && (
        <div style={{ marginTop: 12, fontSize: 13, color: status.startsWith('Error') ? '#b91c1c' : '#047857' }}>
          {status}
        </div>
      )}
    </div>
  );
}
