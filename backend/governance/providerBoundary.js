'use strict';

class ConnectorError extends Error {
  constructor(code, message, { retryable = false, retryAfterMs = null, status = 502 } = {}) {
    super(message); this.name = 'ConnectorError'; this.code = code; this.retryable = retryable;
    this.retryAfterMs = retryAfterMs; this.status = status;
  }
}

async function executeConnector(adapters, kind, command, context = {}) {
  const adapter = adapters[kind];
  if (!adapter?.execute) throw new ConnectorError('connector_not_configured', `${kind} connector is not configured`, { status: 503 });
  if (!context.tenantId || !context.profileId || !context.idempotencyKey || !Array.isArray(context.grantedScopes)) {
    throw new ConnectorError('connector_context_invalid', 'Tenant, profile, idempotency, and scope context are required', { status: 400 });
  }
  if (!(context.grantedScopes).includes(command.requiredScope)) throw new ConnectorError('connector_scope_denied', 'Connector scope is not granted', { status: 403 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(Number(context.timeoutMs || 15_000), 60_000));
  try {
    const result = await adapter.execute(command, { ...context, signal: controller.signal });
    if (!result?.receiptId || !result?.status) throw new ConnectorError('connector_receipt_invalid', 'Connector response requires receipt and status');
    return Object.freeze({ provider: adapter.name || 'unnamed', kind, receiptId: result.receiptId, externalId: result.externalId || null, status: result.status, usage: result.usage || {} });
  } catch (error) {
    if (error instanceof ConnectorError) throw error;
    if (error.name === 'AbortError') throw new ConnectorError('connector_timeout', `${kind} connector timed out`, { retryable: true, status: 504 });
    throw new ConnectorError(error.code || 'connector_failure', `${kind} connector failed`, { retryable: Boolean(error.retryable), retryAfterMs: error.retryAfterMs || null });
  } finally { clearTimeout(timeout); }
}

function retryDelay(attempt, retryAfterMs = 0) {
  if (attempt >= 5) return null;
  return Math.max(Number(retryAfterMs), Math.min(60_000, 1_000 * (2 ** attempt)));
}

module.exports = { ConnectorError, executeConnector, retryDelay };
