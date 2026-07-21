'use strict';

const crypto = require('node:crypto');

class CompanionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CompanionError';
    this.code = code;
    this.details = details;
  }
}

const FOLLOW_THROUGH_TRANSITIONS = Object.freeze({
  proposed: ['saved', 'dismissed'], saved: ['approved', 'dismissed'], approved: ['queued', 'cancelled'],
  queued: ['in_progress', 'failed', 'cancelled'], in_progress: ['completed', 'failed', 'cancelled'],
  failed: ['queued', 'cancelled'], completed: [], dismissed: [], cancelled: [],
});

function requireValue(value, code, message) {
  if (value === undefined || value === null || value === '') throw new CompanionError(code, message);
  return value;
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function assertSubject(auth, resource) {
  if (auth.tenantId !== resource.tenantId) throw new CompanionError('tenant_scope_violation', 'Resource is outside the household');
  if (auth.role !== 'guardian' && auth.profileId !== resource.profileId) throw new CompanionError('profile_scope_violation', 'Resource is outside the profile scope');
}

function createPreferenceVersion(input) {
  requireValue(input.tenantId, 'tenant_required', 'tenantId is required');
  requireValue(input.profileId, 'profile_required', 'profileId is required');
  if (!Array.isArray(input.explicitPreferences)) throw new CompanionError('preferences_invalid', 'Explicit preferences must be an array');
  const preferences = input.explicitPreferences.map((item) => {
    if (!item.key || !['like', 'dislike', 'avoid', 'require', 'neutral'].includes(item.value)) {
      throw new CompanionError('preference_invalid', 'Each preference requires a key and supported value');
    }
    return { key: item.key, value: item.value, source: 'explicit', updatedAt: item.updatedAt || new Date().toISOString() };
  });
  const version = {
    id: input.id || crypto.randomUUID(), tenantId: input.tenantId, profileId: input.profileId,
    sequence: Number(input.sequence || 1), parentVersionId: input.parentVersionId || null,
    preferences, accessibility: input.accessibility || {}, safety: input.safety || {},
    spendingLimitMinorUnits: Number(input.spendingLimitMinorUnits || 0), locale: input.locale || 'en',
    ageBand: input.ageBand || 'adult', createdAt: input.createdAt || new Date().toISOString(),
  };
  return Object.freeze({ ...version, preferenceDigest: digest(version) });
}

function authorizeConnector(input) {
  if (!['calendar', 'commerce', 'device', 'content', 'service'].includes(input.kind)) {
    throw new CompanionError('connector_kind_invalid', 'Connector kind is unsupported');
  }
  if (!Array.isArray(input.requestedScopes) || !input.requestedScopes.length) throw new CompanionError('scopes_required', 'Explicit scopes are required');
  const allowed = new Set(input.allowedScopes || []);
  const excessive = input.requestedScopes.filter((scope) => !allowed.has(scope));
  if (excessive.length) throw new CompanionError('scope_excessive', 'Requested connector scopes exceed policy', { excessive });
  if (!input.consentReceipt || input.consentStatus !== 'granted') throw new CompanionError('connector_consent_required', 'A granted consent receipt is required');
  if (input.profileAgeBand === 'child' && input.guardianApproved !== true) throw new CompanionError('guardian_approval_required', 'Guardian approval is required for a child profile');
  return Object.freeze({
    authorized: true, grantId: input.grantId || crypto.randomUUID(), scopes: [...input.requestedScopes].sort(),
    expiresAt: requireValue(input.expiresAt, 'consent_expiry_required', 'Consent expiry is required'),
    revocationSupported: true, deletionPropagationRequired: true,
  });
}

function buildRecommendation(input) {
  if (!input.preferenceVersionId || !input.preferenceDigest) throw new CompanionError('preference_evidence_required', 'Pinned preference evidence is required');
  if (!Array.isArray(input.options) || !input.options.length) throw new CompanionError('options_required', 'At least one option is required');
  const allowedCategories = new Set(input.allowedCategories || []);
  const candidates = input.options.map((option) => {
    const blockers = [];
    if (!allowedCategories.has(option.category)) blockers.push('category_not_allowed');
    if ((option.safetyTags || []).some((tag) => (input.blockedSafetyTags || []).includes(tag))) blockers.push('safety_policy');
    if ((option.accessibility || []).some((need) => !(input.supportedAccessibility || []).includes(need))) blockers.push('accessibility_mismatch');
    if (input.ageBand === 'child' && option.ageAppropriate !== true) blockers.push('age_protection');
    const relevance = Number(option.relevance || 0);
    const novelty = Number(option.novelty || 0);
    const score = Number((relevance * 0.7 + novelty * 0.3).toFixed(4));
    return { ...option, score, blockers };
  });
  const eligible = candidates.filter((candidate) => !candidate.blockers.length).sort((a, b) => b.score - a.score);
  if (!eligible.length) throw new CompanionError('no_safe_recommendation', 'No option passes preference, safety, accessibility, and age policy');
  const selected = eligible[0];
  const recommendation = {
    id: input.id || crypto.randomUUID(), tenantId: input.tenantId, profileId: input.profileId,
    preferenceVersionId: input.preferenceVersionId, preferenceDigest: input.preferenceDigest,
    selectedOption: selected, alternatives: eligible.slice(1, 4), rejected: candidates.filter((candidate) => candidate.blockers.length),
    explanation: {
      factors: selected.reasons || [], tradeoffs: selected.tradeoffs || [], dataSources: input.dataSources || [],
      limitations: input.limitations || [], sponsored: selected.sponsored === true,
    },
    status: 'proposed', consequentialActionAllowed: false,
  };
  return Object.freeze({ ...recommendation, recommendationDigest: digest(recommendation) });
}

function evaluateRecommendations(input) {
  const results = input.results || [];
  if (!results.length) throw new CompanionError('evaluation_results_required', 'Representative evaluation results are required');
  const average = (key) => results.reduce((sum, result) => sum + Number(result[key] || 0), 0) / results.length;
  const metrics = {
    relevance: average('relevance'), diversity: average('diversity'), safetyViolationRate: average('safetyViolation'),
    accessibilityPassRate: average('accessibilityPass'), coldStartRelevance: average('coldStartRelevance'),
    preferenceDriftRecovery: average('preferenceDriftRecovery'), fallbackSuccessRate: average('fallbackSuccess'),
  };
  const thresholds = input.thresholds || {};
  const failures = [];
  if (metrics.relevance < Number(thresholds.minimumRelevance ?? 0)) failures.push('relevance');
  if (metrics.diversity < Number(thresholds.minimumDiversity ?? 0)) failures.push('diversity');
  if (metrics.safetyViolationRate > Number(thresholds.maximumSafetyViolationRate ?? 0)) failures.push('safety');
  if (metrics.accessibilityPassRate < Number(thresholds.minimumAccessibilityPassRate ?? 1)) failures.push('accessibility');
  if (metrics.coldStartRelevance < Number(thresholds.minimumColdStartRelevance ?? 0)) failures.push('cold_start');
  if (metrics.preferenceDriftRecovery < Number(thresholds.minimumPreferenceDriftRecovery ?? 0)) failures.push('preference_drift');
  if (metrics.fallbackSuccessRate < Number(thresholds.minimumFallbackSuccessRate ?? 1)) failures.push('failure_behavior');
  return Object.freeze({ passed: failures.length === 0, failures, metrics });
}

function assessServiceCancellation(input) {
  const service = input.service || {};
  requireValue(service.provider, 'service_provider_required', 'Service provider is required');
  requireValue(service.accountReference, 'account_reference_required', 'An opaque account reference is required');
  if (!service.priceEvidenceReceipt || !service.termsEvidenceReceipt || !service.evidenceObservedAt) {
    throw new CompanionError('service_evidence_required', 'Price, terms, and observation evidence are required');
  }
  const evidenceAgeMs = new Date(input.evaluatedAt || Date.now()) - new Date(service.evidenceObservedAt);
  if (!Number.isFinite(evidenceAgeMs) || evidenceAgeMs > Number(input.maximumEvidenceAgeMs || 86_400_000)) {
    throw new CompanionError('service_evidence_stale', 'Service price or terms evidence is stale');
  }
  const monthlyCost = service.billingCycle === 'annual' ? Number(service.amountMinorUnits) / 12 : Number(service.amountMinorUnits);
  const remainingMonths = Math.max(0, Number(service.remainingCommitmentMonths || 0));
  const terminationFee = Number(service.terminationFeeMinorUnits || 0);
  const projectedGrossSavings = Math.round(monthlyCost * Number(input.horizonMonths || 12));
  const alternativeCost = Math.round(Number(input.alternativeMonthlyMinorUnits || 0) * Number(input.horizonMonths || 12));
  const netSavings = projectedGrossSavings - alternativeCost - terminationFee;
  const blockers = [];
  if (service.essential === true) blockers.push('essential_service');
  if (service.householdDependencies > 0) blockers.push('household_dependency');
  if (service.accessibilityDependency === true) blockers.push('accessibility_dependency');
  if (remainingMonths > 0 && terminationFee > netSavings) blockers.push('termination_cost');
  if (!service.cancellationMethod || !service.noticePeriodDays) blockers.push('terms_incomplete');
  return Object.freeze({
    eligible: blockers.length === 0 && netSavings > 0, blockers, monthlyCostMinorUnits: Math.round(monthlyCost),
    grossSavingsMinorUnits: projectedGrossSavings, alternativeCostMinorUnits: alternativeCost,
    terminationFeeMinorUnits: terminationFee, netSavingsMinorUnits: netSavings,
    evidenceAgeMs, status: 'advisory', cancellationAllowed: false,
    steps: service.cancellationMethod ? [`Use verified ${service.cancellationMethod} process`, `Observe ${service.noticePeriodDays}-day notice period`] : [],
  });
}

function authorizeAction(input) {
  const blockers = [];
  if (input.recommendationStatus !== 'saved') blockers.push('recommendation_not_saved');
  if (input.recommendationDigest !== input.approval?.recommendationDigest) blockers.push('approval_digest_mismatch');
  if (input.approval?.decision !== 'approved') blockers.push('approval_required');
  if (input.actorId !== input.approval?.actorId) blockers.push('actor_mismatch');
  if (input.costMinorUnits > input.spendingLimitMinorUnits) blockers.push('spending_limit');
  if (input.profileAgeBand === 'child' && input.approval?.role !== 'guardian') blockers.push('guardian_approval_required');
  if (!input.connectorScopes?.includes(input.requiredScope)) blockers.push('connector_scope_required');
  if (input.connectorStatus !== 'active') blockers.push('connector_not_active');
  if (blockers.length) throw new CompanionError('action_blocked', 'Consequential action requirements are not satisfied', { blockers });
  return Object.freeze({
    authorized: true, actionId: input.actionId || crypto.randomUUID(),
    idempotencyKey: digest([input.tenantId, input.recommendationId, input.recommendationDigest, input.requiredScope]),
  });
}

function transitionFollowThrough(state, nextStatus, evidence = {}) {
  if (!(FOLLOW_THROUGH_TRANSITIONS[state.status] || []).includes(nextStatus)) {
    throw new CompanionError('follow_through_transition_invalid', `${state.status} cannot transition to ${nextStatus}`);
  }
  if (nextStatus === 'completed' && (!evidence.providerReceipt || !evidence.completedAt)) {
    throw new CompanionError('completion_evidence_required', 'Completion requires receipt and timestamp');
  }
  if (nextStatus === 'failed' && (!evidence.errorCode || evidence.retryable === undefined)) {
    throw new CompanionError('failure_evidence_required', 'Failure requires typed error and retryability');
  }
  return Object.freeze({ ...state, status: nextStatus, evidence: Object.freeze({ ...evidence }) });
}

function deletionPlan(input) {
  if (!input.profileId || !Array.isArray(input.activeConnectors)) throw new CompanionError('deletion_request_invalid', 'Profile and connector inventory are required');
  return Object.freeze({
    profileId: input.profileId,
    localScopes: ['preferences', 'recommendations', 'feedback', 'history', 'connector_tokens'],
    propagations: input.activeConnectors.map((connector) => ({ connectorId: connector.id, provider: connector.provider, status: 'pending', deadlineAt: connector.deletionDeadlineAt })),
    status: input.activeConnectors.length ? 'propagating' : 'ready_to_finalize',
    hardDeleteAllowed: input.legalHold !== true,
  });
}

module.exports = {
  CompanionError, FOLLOW_THROUGH_TRANSITIONS, assessServiceCancellation, assertSubject, authorizeAction,
  authorizeConnector, buildRecommendation, createPreferenceVersion, deletionPlan, digest,
  evaluateRecommendations, transitionFollowThrough,
};
