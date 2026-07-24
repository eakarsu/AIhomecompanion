'use strict';

const express = require('express');
const fetch = require('node-fetch');

function config(env) {
  const apiKey = String(env.OPENROUTER_API_KEY || '').trim();
  const model = String(env.OPENROUTER_MODEL || '').trim();
  const baseUrl = String(env.OPENROUTER_BASE_URL || '').replace(/\/+$/, '');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is required');
  if (!model) throw new Error('OPENROUTER_MODEL is required');
  if (baseUrl !== 'https://openrouter.ai/api/v1') throw new Error('OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1');
  return { apiKey, model, endpoint: `${baseUrl}/chat/completions` };
}

function createAiRouter(pool, env = process.env) {
  const router = express.Router();

  router.get(['/history', '/conversations'], async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT id,feature,input,output,model,created_at
           FROM companion_ai_interactions
          WHERE tenant_id=$1 AND profile_id=$2 AND actor_id=$3
          ORDER BY created_at DESC LIMIT 50`,
        [req.auth.tenantId, req.auth.profileId, req.auth.userId],
      );
      return res.json(result.rows);
    } catch (error) { return next(error); }
  });

  router.post('/chat', async (req, res, next) => {
    try {
      const message = String(req.body?.message || '').trim();
      if (!message) return res.status(400).json({ error: 'message_required' });
      const { apiKey, model, endpoint } = config(env);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'AI Home Companion' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a practical home companion. Give specific, safe, concise advice and clearly identify any uncertainty.' },
            { role: 'user', content: message },
          ],
          max_tokens: 700,
        }),
      });
      if (!response.ok) throw new Error(`OpenRouter API error (${response.status})`);
      const body = await response.json();
      const answer = String(body.choices?.[0]?.message?.content || '').trim();
      if (!answer) throw new Error('OpenRouter returned an empty response');
      const saved = await pool.query(
        `INSERT INTO companion_ai_interactions(tenant_id,profile_id,actor_id,feature,input,output,model)
         VALUES($1,$2,$3,'chat',$4::jsonb,$5::jsonb,$6) RETURNING id,created_at`,
        [req.auth.tenantId, req.auth.profileId, req.auth.userId, JSON.stringify({ message }), JSON.stringify({ response: answer }), model],
      );
      return res.json({ response: answer, model, interactionId: saved.rows[0].id, timestamp: saved.rows[0].created_at });
    } catch (error) { return next(error); }
  });

  return router;
}

module.exports = { createAiRouter };
