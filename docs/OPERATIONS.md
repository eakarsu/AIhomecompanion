# Governed Home Companion Operations

## Product and privacy boundary

The supported API is `/api/governance`. Each profile has explicit, editable, immutable preference versions; recommendations pin the preference version, expose factors, tradeoffs, data sources, limitations, alternatives, rejected unsafe options, and sponsorship; follow-through and correction are durable. Recommendations never directly purchase, book, cancel, message, or control a device.

Calendar, commerce, device, content, and service connectors require an attributable consent receipt, a least-privilege scope allowlist, expiry, an opaque secret-manager credential reference, and guardian approval for child profiles. Revocation disables new work immediately and queues provider revocation. Export and deletion are profile-scoped; deletion remains incomplete until every connector returns a deletion receipt or an operator records a manual resolution. Legal holds block hard deletion without exposing held data to ordinary reads.

Consequential actions require the profile to save the exact recommendation, an actor approval over its digest, cost within the explicit spending limit, active connector consent with the exact scope, and guardian approval for a child profile. Ambiguous provider timeouts are reconciled before retry; a queued action is never presented as completed.

## Service cancellation optimizer

The governed cancellation assessment uses stored provider/account reference, current price and terms receipts, billing cycle, commitment, termination fee, usage/dependencies, essential-service and accessibility flags, cancellation method, and notice period. It calculates integer-minor-unit gross, alternative, termination, and net costs. It blocks essential, shared, accessibility-dependent, stale, incomplete, or economically adverse cancellations and produces review steps only. Cancellation is still a consequential service-connector action and cannot run without explicit approval and a durable receipt.

## Installation and lifecycle

1. Run `scripts/bootstrap.sh` explicitly to install pinned dependencies.
2. Copy `.env.example` to `.env` and provide secrets via the deployment secret manager. Use a strong JWT secret, issuer/audience, and tenant/profile claims.
3. Review and back up the PostgreSQL target; run `./start.sh migrate` as a migration principal.
4. Provision households, profiles, users, guardian relationships, connector scope policies, and evaluation policies through an approved administrative process. No demo credentials or personal history are seeded.
5. Run `./start.sh check`, then `./start.sh start` as a least-privileged identity. Production requires verified database TLS.

Startup never installs dependencies, creates/seeds a database, applies migrations, starts services, takes ports, or kills processes.

## Connector recovery and deletion

Workers claim outbox rows with leases, carry tenant/profile scope and payload-bound idempotency, and store typed non-secret receipts. Retry retryable failures at most five times with bounded delay; dead letters require retry, manual completion, or cancellation. Reconcile commerce/service/device state after timeout before replay. Alert on expiring/revoked grants, scope denials, lease expiry, dead letters, receipt mismatches, recommendation safety/evaluation regression, export expiry, and deletion propagation deadlines.

On consent withdrawal, stop new connector work, revoke tokens at the provider, remove cached data, and record receipts. On deletion, produce the requested export first when applicable, suspend the profile, propagate deletion, verify provider confirmations, respect legal holds/retention, then replace identity links with non-reversible tombstones. Restore backups only into isolation and reapply completed deletion tombstones before serving traffic.

## External validation still required

Before launch, operators must apply the migration and verify RLS with production roles; certify real calendar, commerce, device, content, and service adapters and their revoke/delete semantics; run representative user research and offline evaluation for relevance, diversity, safety, accessibility, cold start, preference drift, age protections, and failure behavior; test actual purchase/booking/cancellation/device flows in sandboxes; perform security, privacy, accessibility, browser, load, backup/restore, deletion, incident, and disaster-recovery exercises; and obtain privacy, consumer-protection, child-safety, accessibility, financial-control, vendor-contract, and legal review. Credentials, personal data, providers, device hardware, licensed content, and professional approval remain external.
