'use strict';
const express = require('express');
const {
  CompanionError, assessServiceCancellation, assertSubject, authorizeAction, authorizeConnector,
  buildRecommendation, createPreferenceVersion, deletionPlan, digest, evaluateRecommendations, transitionFollowThrough,
} = require('./homeCompanionDomain');
const { requireRoles } = require('./auth');

async function transaction(pool, work) { const client = await pool.connect(); try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } }
const audit = (client, auth, action, entityType, entityId, evidence = {}) => client.query(
  `INSERT INTO companion_audit_events(tenant_id,profile_id,actor_id,action,entity_type,entity_id,evidence) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)`,
  [auth.tenantId,auth.profileId,auth.userId,action,entityType,entityId,JSON.stringify(evidence)],
);

function createGovernanceRouter(pool) {
  const router = express.Router();

  router.post('/preferences', async (req,res,next) => { try {
    const version = createPreferenceVersion({...req.body,tenantId:req.auth.tenantId,profileId:req.auth.profileId});
    const result = await transaction(pool,async(client)=>{ const inserted=await client.query(
      `INSERT INTO companion_preference_versions(id,tenant_id,profile_id,sequence,parent_version_id,preferences,accessibility,safety,spending_limit_minor,locale,age_band,preference_digest,created_by)
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13) RETURNING *`,
      [version.id,version.tenantId,version.profileId,version.sequence,version.parentVersionId,JSON.stringify(version.preferences),JSON.stringify(version.accessibility),JSON.stringify(version.safety),version.spendingLimitMinorUnits,version.locale,version.ageBand,version.preferenceDigest,req.auth.userId]);
      await audit(client,req.auth,'preferences.versioned','preference_version',version.id,{digest:version.preferenceDigest}); return inserted.rows[0]; });
    res.status(201).json(result);
  } catch(error){next(error);} });

  router.post('/connector-grants', async(req,res,next)=>{try{
    const profile=await pool.query('SELECT age_band FROM companion_profiles WHERE id=$1 AND tenant_id=$2',[req.auth.profileId,req.auth.tenantId]);
    if(!profile.rowCount) throw new CompanionError('profile_not_found','Profile was not found');
    const grant=authorizeConnector({...req.body,profileAgeBand:profile.rows[0].age_band,guardianApproved:req.auth.role==='guardian'});
    const result=await pool.query(
      `INSERT INTO companion_connector_grants(id,tenant_id,profile_id,kind,provider,scopes,consent_receipt,expires_at,status,credential_reference,created_by)
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'active',$9,$10) RETURNING *`,
      [grant.grantId,req.auth.tenantId,req.auth.profileId,req.body.kind,req.body.provider,JSON.stringify(grant.scopes),req.body.consentReceipt,grant.expiresAt,req.body.credentialReference,req.auth.userId]);
    res.status(201).json(result.rows[0]);
  }catch(error){next(error);} });

  router.post('/connector-grants/:grantId/revoke',async(req,res,next)=>{try{
    const result=await transaction(pool,async(client)=>{ const updated=await client.query(
      `UPDATE companion_connector_grants SET status='revoked',revoked_at=now() WHERE id=$1 AND tenant_id=$2 AND profile_id=$3 AND status='active' RETURNING *`,
      [req.params.grantId,req.auth.tenantId,req.auth.profileId]); if(!updated.rowCount) throw new CompanionError('grant_not_found','Active grant was not found');
      await client.query(`INSERT INTO companion_provider_outbox(tenant_id,profile_id,grant_id,capability,aggregate_type,aggregate_id,command,payload_digest,idempotency_key)
        VALUES($1,$2,$3,'revoke','connector_grant',$3,$4::jsonb,$5,$5) ON CONFLICT DO NOTHING`,
        [req.auth.tenantId,req.auth.profileId,req.params.grantId,JSON.stringify({grantId:req.params.grantId}),digest(['revoke',req.params.grantId])]);
      await audit(client,req.auth,'connector.revoked','connector_grant',req.params.grantId); return updated.rows[0]; }); res.json(result);
  }catch(error){next(error);} });

  router.post('/recommendations',async(req,res,next)=>{try{
    const pref=await pool.query('SELECT * FROM companion_preference_versions WHERE id=$1 AND tenant_id=$2 AND profile_id=$3',[req.body.preferenceVersionId,req.auth.tenantId,req.auth.profileId]);
    if(!pref.rowCount) throw new CompanionError('preference_not_found','Preference version was not found');
    const recommendation=buildRecommendation({...req.body,tenantId:req.auth.tenantId,profileId:req.auth.profileId,preferenceDigest:pref.rows[0].preference_digest,ageBand:pref.rows[0].age_band});
    const result=await pool.query(`INSERT INTO companion_recommendations(id,tenant_id,profile_id,preference_version_id,preference_digest,recommendation_digest,selected_option,alternatives,rejected,explanation,status,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,'proposed',$11) RETURNING *`,
      [recommendation.id,recommendation.tenantId,recommendation.profileId,recommendation.preferenceVersionId,recommendation.preferenceDigest,recommendation.recommendationDigest,JSON.stringify(recommendation.selectedOption),JSON.stringify(recommendation.alternatives),JSON.stringify(recommendation.rejected),JSON.stringify(recommendation.explanation),req.auth.userId]);
    res.status(201).json(result.rows[0]);
  }catch(error){next(error);} });

  router.post('/recommendations/:id/follow-through',async(req,res,next)=>{try{
    const result=await transaction(pool,async(client)=>{const found=await client.query('SELECT * FROM companion_recommendations WHERE id=$1 AND tenant_id=$2 AND profile_id=$3 FOR UPDATE',[req.params.id,req.auth.tenantId,req.auth.profileId]);
      if(!found.rowCount) throw new CompanionError('recommendation_not_found','Recommendation was not found'); assertSubject(req.auth,{tenantId:found.rows[0].tenant_id,profileId:found.rows[0].profile_id});
      const nextState=transitionFollowThrough({status:found.rows[0].status},req.body.nextStatus,req.body.evidence||{});
      const updated=await client.query('UPDATE companion_recommendations SET status=$2,updated_at=now() WHERE id=$1 RETURNING *',[req.params.id,nextState.status]);
      await audit(client,req.auth,'recommendation.transitioned','recommendation',req.params.id,{from:found.rows[0].status,to:nextState.status,evidence:req.body.evidence||{}});return updated.rows[0];});res.json(result);
  }catch(error){next(error);} });

  router.post('/recommendations/:id/feedback',async(req,res,next)=>{try{const result=await pool.query(
    `INSERT INTO companion_recommendation_feedback(tenant_id,profile_id,recommendation_id,rating,correction,created_by)
     SELECT tenant_id,profile_id,id,$4,$5::jsonb,$6 FROM companion_recommendations WHERE id=$1 AND tenant_id=$2 AND profile_id=$3 RETURNING *`,
    [req.params.id,req.auth.tenantId,req.auth.profileId,req.body.rating,JSON.stringify(req.body.correction||{}),req.auth.userId]);if(!result.rowCount)throw new CompanionError('recommendation_not_found','Recommendation was not found');res.status(201).json(result.rows[0]);}catch(error){next(error);} });

  router.post('/evaluations',requireRoles('guardian'),async(req,res,next)=>{try{const evaluation=evaluateRecommendations(req.body);const result=await pool.query(
    `INSERT INTO companion_evaluations(tenant_id,evaluation_set_version,policy_version,passed,failures,metrics,created_by) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7) RETURNING *`,
    [req.auth.tenantId,req.body.evaluationSetVersion,req.body.policyVersion,evaluation.passed,JSON.stringify(evaluation.failures),JSON.stringify(evaluation.metrics),req.auth.userId]);res.status(201).json(result.rows[0]);}catch(error){next(error);} });

  router.post('/service-subscriptions/:id/cancellation-assessments',async(req,res,next)=>{try{const found=await pool.query('SELECT * FROM companion_service_subscriptions WHERE id=$1 AND tenant_id=$2 AND profile_id=$3',[req.params.id,req.auth.tenantId,req.auth.profileId]);if(!found.rowCount)throw new CompanionError('subscription_not_found','Subscription was not found');const row=found.rows[0];
    const assessment=assessServiceCancellation({...req.body,service:{...row.service_snapshot,provider:row.provider,accountReference:row.account_reference,priceEvidenceReceipt:row.price_evidence_receipt,termsEvidenceReceipt:row.terms_evidence_receipt,evidenceObservedAt:row.evidence_observed_at}});
    const result=await pool.query(`INSERT INTO companion_cancellation_assessments(tenant_id,profile_id,subscription_id,assessment,eligible,net_savings_minor,evidence_digest,created_by) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8) RETURNING *`,
      [req.auth.tenantId,req.auth.profileId,row.id,JSON.stringify(assessment),assessment.eligible,assessment.netSavingsMinorUnits,digest([row.price_evidence_receipt,row.terms_evidence_receipt,row.evidence_observed_at]),req.auth.userId]);res.status(201).json(result.rows[0]);
  }catch(error){next(error);} });

  router.post('/recommendations/:id/approvals',async(req,res,next)=>{try{const result=await pool.query(
    `INSERT INTO companion_action_approvals(tenant_id,profile_id,recommendation_id,actor_id,role,decision,recommendation_digest,cost_minor_units,rationale)
     SELECT tenant_id,profile_id,id,$4,$5,$6,recommendation_digest,$7,$8 FROM companion_recommendations WHERE id=$1 AND tenant_id=$2 AND profile_id=$3 AND status='saved' RETURNING *`,
    [req.params.id,req.auth.tenantId,req.auth.profileId,req.auth.userId,req.auth.role,req.body.decision,req.body.costMinorUnits,req.body.rationale]);if(!result.rowCount)throw new CompanionError('recommendation_not_approvable','Saved recommendation was not found');res.status(201).json(result.rows[0]);}catch(error){next(error);} });

  router.post('/recommendations/:id/actions',async(req,res,next)=>{try{const result=await transaction(pool,async(client)=>{const recResult=await client.query(`SELECT r.*,p.spending_limit_minor,p.age_band FROM companion_recommendations r JOIN companion_preference_versions p ON p.id=r.preference_version_id WHERE r.id=$1 AND r.tenant_id=$2 AND r.profile_id=$3 FOR UPDATE OF r`,[req.params.id,req.auth.tenantId,req.auth.profileId]);if(!recResult.rowCount)throw new CompanionError('recommendation_not_found','Recommendation was not found');const rec=recResult.rows[0];
      const approvalResult=await client.query('SELECT * FROM companion_action_approvals WHERE recommendation_id=$1 AND actor_id=$2 ORDER BY decided_at DESC LIMIT 1',[rec.id,req.auth.userId]);
      const grantResult=await client.query(`SELECT * FROM companion_connector_grants WHERE id=$1 AND tenant_id=$2 AND profile_id=$3 AND status='active' AND expires_at>now()`,[req.body.grantId,req.auth.tenantId,req.auth.profileId]);const grant=grantResult.rows[0];
      const authorization=authorizeAction({tenantId:req.auth.tenantId,recommendationId:rec.id,recommendationDigest:rec.recommendation_digest,recommendationStatus:rec.status,approval:approvalResult.rows[0]&&{actorId:approvalResult.rows[0].actor_id,role:approvalResult.rows[0].role,decision:approvalResult.rows[0].decision,recommendationDigest:approvalResult.rows[0].recommendation_digest},actorId:req.auth.userId,costMinorUnits:Number(req.body.costMinorUnits||0),spendingLimitMinorUnits:Number(rec.spending_limit_minor),profileAgeBand:rec.age_band,connectorScopes:grant?.scopes||[],connectorStatus:grant?.status,requiredScope:req.body.requiredScope});
      const command={recommendationId:rec.id,requiredScope:req.body.requiredScope,input:req.body.input||{}};const outbox=await client.query(`INSERT INTO companion_provider_outbox(tenant_id,profile_id,grant_id,capability,aggregate_type,aggregate_id,command,payload_digest,idempotency_key) VALUES($1,$2,$3,$4,'recommendation',$5,$6::jsonb,$7,$8) ON CONFLICT(tenant_id,capability,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,[req.auth.tenantId,req.auth.profileId,req.body.grantId,req.body.capability,rec.id,JSON.stringify(command),digest(command),authorization.idempotencyKey]);await client.query("UPDATE companion_recommendations SET status='queued',updated_at=now() WHERE id=$1",[rec.id]);await audit(client,req.auth,'action.queued','recommendation',rec.id,{idempotencyKey:authorization.idempotencyKey});return outbox.rows[0];});res.status(202).json(result);
  }catch(error){next(error);} });

  router.post('/exports',async(req,res,next)=>{try{const result=await pool.query(`INSERT INTO companion_export_requests(tenant_id,profile_id,status,requested_by) VALUES($1,$2,'requested',$3) RETURNING *`,[req.auth.tenantId,req.auth.profileId,req.auth.userId]);res.status(202).json(result.rows[0]);}catch(error){next(error);} });
  router.post('/deletions',async(req,res,next)=>{try{const connectors=await pool.query(`SELECT id,provider FROM companion_connector_grants WHERE tenant_id=$1 AND profile_id=$2 AND status IN('active','revoked','deletion_pending')`,[req.auth.tenantId,req.auth.profileId]);const plan=deletionPlan({profileId:req.auth.profileId,legalHold:req.body.legalHold===true,activeConnectors:connectors.rows.map(row=>({...row,deletionDeadlineAt:req.body.deadlineAt}))});
    const result=await transaction(pool,async(client)=>{const request=await client.query(`INSERT INTO companion_deletion_requests(tenant_id,profile_id,status,legal_hold,requested_by) VALUES($1,$2,$3,$4,$5) RETURNING *`,[req.auth.tenantId,req.auth.profileId,plan.status,req.body.legalHold===true,req.auth.userId]);for(const propagation of plan.propagations){await client.query(`INSERT INTO companion_deletion_propagations(tenant_id,profile_id,deletion_request_id,grant_id,status,deadline_at) VALUES($1,$2,$3,$4,'pending',$5)`,[req.auth.tenantId,req.auth.profileId,request.rows[0].id,propagation.connectorId,propagation.deadlineAt]);}await audit(client,req.auth,'deletion.requested','deletion_request',request.rows[0].id,{connectorCount:plan.propagations.length,legalHold:req.body.legalHold===true});return request.rows[0];});res.status(202).json(result);
  }catch(error){next(error);} });
  return router;
}
module.exports={createGovernanceRouter,transaction};
