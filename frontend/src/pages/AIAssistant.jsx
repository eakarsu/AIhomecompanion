import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../App';

function renderAIText(text) {
  if (!text) return null;
  // Convert markdown-like formatting to styled HTML
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#a78bfa', margin: '12px 0 6px', fontSize: 14, fontWeight: 600 }}>{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#60a5fa', margin: '16px 0 8px', fontSize: 16, fontWeight: 600 }}>{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#60a5fa', margin: '16px 0 8px', fontSize: 18, fontWeight: 700 }}>{line.slice(2)}</h2>;
    // Bullet points
    if (line.match(/^[-*•]\s/)) return (
      <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', paddingLeft: 8 }}>
        <span style={{ color: '#3b82f6', flexShrink: 0 }}>•</span>
        <span>{formatInline(line.slice(2))}</span>
      </div>
    );
    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      return (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', paddingLeft: 8 }}>
          <span style={{ color: '#6366f1', fontWeight: 600, flexShrink: 0, minWidth: 20 }}>{num}.</span>
          <span>{formatInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    }
    // Empty lines
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    // Regular text
    return <p key={i} style={{ padding: '2px 0', lineHeight: 1.7 }}>{formatInline(line)}</p>;
  });
}

function formatInline(text) {
  // Bold
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#f1f5f9', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIAssistant() {
  const { token, API } = useContext(AppContext);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState('');
  const messagesEnd = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/ai/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setConversations(Array.isArray(data) ? data.reverse() : []);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    const userMsg = message;
    setMessage('');
    setConversations(prev => [...prev, { user_message: userMsg, ai_response: null, created_at: new Date().toISOString() }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setConversations(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          user_message: userMsg,
          ai_response: data.response,
          model: data.model,
          tokens_used: data.tokens_used,
          created_at: data.timestamp,
        };
        return updated;
      });
    } catch (err) {
      setConversations(prev => {
        const updated = [...prev];
        updated[updated.length - 1].ai_response = 'Error: ' + err.message;
        return updated;
      });
    }
    setLoading(false);
  };

  const runAnalysis = async (type) => {
    setAnalysisLoading(type);
    setAiAnalysis(null);
    const endpoints = {
      energy: 'analyze-energy',
      security: 'analyze-security',
      automation: 'suggest-automation',
      health: 'health-report',
    };
    try {
      const res = await fetch(`${API}/ai/${endpoints[type]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAiAnalysis({
        type,
        content: data.analysis || data.suggestions || data.report,
        model: data.model,
        tokens: data.tokens_used,
        timestamp: data.timestamp,
      });
    } catch (err) {
      setAiAnalysis({ type, content: 'Error: ' + err.message, model: '', tokens: 0 });
    }
    setAnalysisLoading('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🤖 AI Assistant</h2>
          <p>Chat with your intelligent home companion</p>
        </div>
      </div>

      {/* AI Analysis Buttons */}
      <div className="ai-buttons">
        {[
          { key: 'energy', label: '⚡ Energy Analysis', icon: '⚡' },
          { key: 'security', label: '🔒 Security Assessment', icon: '🔒' },
          { key: 'automation', label: '🤖 Suggest Automations', icon: '🤖' },
          { key: 'health', label: '🏥 Home Health Report', icon: '🏥' },
        ].map(btn => (
          <button
            key={btn.key}
            className="btn-primary"
            onClick={() => runAnalysis(btn.key)}
            disabled={!!analysisLoading}
            style={{ opacity: analysisLoading && analysisLoading !== btn.key ? 0.5 : 1 }}
          >
            {analysisLoading === btn.key ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}></span>Analyzing...</>
            ) : btn.label}
          </button>
        ))}
      </div>

      {/* AI Analysis Output */}
      {aiAnalysis && (
        <div className="ai-output-card">
          <div className="ai-badge">
            <span>🤖</span>
            <span>AI {aiAnalysis.type.charAt(0).toUpperCase() + aiAnalysis.type.slice(1)} Analysis</span>
          </div>
          <div className="ai-text">
            {renderAIText(aiAnalysis.content)}
          </div>
          <div className="ai-meta">
            <span>Model: {aiAnalysis.model}</span>
            <span>Tokens: {aiAnalysis.tokens}</span>
            <span>Generated: {new Date(aiAnalysis.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="ai-chat" style={{ marginTop: 20 }}>
        <div className="ai-messages">
          {conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <p>Start a conversation with your AI Home Companion</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Try: "What's the temperature in the living room?" or "Any security concerns?"</p>
            </div>
          )}
          {conversations.map((conv, i) => (
            <React.Fragment key={i}>
              <div className="ai-message user">
                <div className="avatar">👤</div>
                <div className="content">
                  <div className="name">You</div>
                  <div className="text">{conv.user_message}</div>
                </div>
              </div>
              {conv.ai_response && (
                <div className="ai-message assistant">
                  <div className="avatar">🤖</div>
                  <div className="content">
                    <div className="name">AI Companion {conv.model ? `(${conv.model})` : ''}</div>
                    <div className="text">
                      <div className="ai-output-card" style={{ margin: 0, padding: 16 }}>
                        {renderAIText(conv.ai_response)}
                        {conv.tokens_used && (
                          <div className="ai-meta">
                            <span>Tokens: {conv.tokens_used}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!conv.ai_response && loading && i === conversations.length - 1 && (
                <div className="ai-message assistant">
                  <div className="avatar">🤖</div>
                  <div className="content">
                    <div className="name">AI Companion</div>
                    <div className="text"><div className="spinner" style={{ display: 'inline-block' }}></div> Thinking...</div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEnd} />
        </div>
        <form className="ai-input-area" onSubmit={sendMessage}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ask your AI home companion anything..."
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !message.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
