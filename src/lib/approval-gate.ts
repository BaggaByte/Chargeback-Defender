/**
 * Server-side dispute approval gate.
 *
 * The client sends an approval request. The server independently verifies
 * every requirement. Client-supplied booleans like { evidenceConfirmed: true }
 * are NOT trusted — the server checks the actual database state.
 */
import { DisputeRecord } from '@/lib/types';

export interface ApprovalCheck {
  passed: boolean;
  reason: string;
}

export interface ApprovalGateResult {
  canApprove: boolean;
  /**
   * All checks that were evaluated, regardless of outcome.
   * Use this to surface exactly why approval was denied.
   */
  checks: ApprovalCheck[];
  /**
   * Human-readable summary for the API response / audit log.
   */
  summary: string;
}

/**
 * Evaluates whether a dispute is ready for human approval and Stripe submission.
 *
 * Every check is computed from the dispute record loaded from the database.
 * The caller provides session context (userId, orgId, role) so that
 * authentication/authorization is enforced at the same layer.
 */
export function evaluateApprovalGate(
  dispute: DisputeRecord,
  actor: {
    userId: string | undefined;
    orgId: string;
    role: string | undefined;
  }
): ApprovalGateResult {
  const checks: ApprovalCheck[] = [];

  // 1. Actor is authenticated
  checks.push({
    passed: Boolean(actor.userId),
    reason: actor.userId ? 'Actor is authenticated' : 'No authenticated user — session missing',
  });

  // 2. Dispute belongs to the actor's organization
  checks.push({
    passed: dispute.organizationId === actor.orgId,
    reason:
      dispute.organizationId === actor.orgId
        ? 'Dispute belongs to the actor organization'
        : 'Dispute belongs to a different organization (IDOR check failed)',
  });

  // 3. Actor has a role that is permitted to approve (not OPERATOR)
  const approverRoles = ['ADMIN', 'MANAGER', 'SUPER_ADMIN', 'RISK_MANAGER'];
  const roleOk = actor.role ? approverRoles.includes(actor.role) : false;
  checks.push({
    passed: roleOk,
    reason: roleOk
      ? `Role '${actor.role}' is permitted to approve`
      : `Role '${actor.role ?? 'UNKNOWN'}' is not permitted to approve — requires ADMIN or MANAGER`,
  });

  // 4. Dispute is in an approvable state
  const approvableStatuses = ['PENDING_APPROVAL', 'NEEDS_REVIEW', 'AI_ANALYZED', 'EVIDENCE_READY'];
  const statusOk = approvableStatuses.includes(dispute.status);
  checks.push({
    passed: statusOk,
    reason: statusOk
      ? `Dispute status '${dispute.status}' is approvable`
      : `Dispute status '${dispute.status}' cannot be approved (already ${dispute.status === 'SUBMITTED' || dispute.status === 'WON' || dispute.status === 'LOST' ? 'terminal' : 'in wrong state'})`,
  });

  // 5. At least one evidence item exists
  const evidenceCount = dispute.evidenceList?.length ?? 0;
  checks.push({
    passed: evidenceCount > 0,
    reason:
      evidenceCount > 0
        ? `${evidenceCount} evidence item(s) present`
        : 'No evidence items attached — cannot submit without evidence',
  });

  // 6. At least one evidence item is included in submission
  const includedCount = (dispute.evidenceList ?? []).filter((e) => e.isIncludedInSubmission).length;
  checks.push({
    passed: includedCount > 0,
    reason:
      includedCount > 0
        ? `${includedCount} evidence item(s) marked for submission`
        : 'No evidence items are marked for inclusion in the Stripe submission',
  });

  // 7. A rebuttal letter exists
  const hasRebuttal = Boolean(dispute.rebuttalLetter && dispute.rebuttalLetter.trim().length > 20);
  checks.push({
    passed: hasRebuttal,
    reason: hasRebuttal
      ? 'Rebuttal letter is present'
      : 'No rebuttal letter — generate an AI draft before approving',
  });

  // 8. AI analysis has been run
  const hasAIAnalysis = Boolean(dispute.aiAnalysis);
  checks.push({
    passed: hasAIAnalysis,
    reason: hasAIAnalysis
      ? 'AI analysis is present'
      : 'AI analysis has not been run — trigger analysis before approving',
  });

  // 9. AI verification passed (soft check — warn but do not hard-block)
  //    We downgrade this to a warning so that an analyst can override a false-positive.
  //    The soft result is still surfaced in the summary for the audit log.
  const aiVerification = (dispute.aiAnalysis as any)?.verification;
  const verificationPassed = aiVerification ? aiVerification.passed === true : null;
  checks.push({
    // null means analysis hasn't run — treated the same as check #8
    passed: verificationPassed !== false,
    reason:
      verificationPassed === true
        ? 'AI hallucination verification passed'
        : verificationPassed === false
          ? 'WARNING: AI hallucination verification flagged unsupported claims — review carefully before approving'
          : 'AI verification not yet available',
  });

  // 10. Dispute is not past its deadline
  const deadline = dispute.deadline ? new Date(dispute.deadline) : null;
  const isPastDeadline = deadline ? deadline < new Date() : false;
  checks.push({
    passed: !isPastDeadline,
    reason: !isPastDeadline
      ? deadline
        ? `Deadline is ${deadline.toISOString()} — still within window`
        : 'No deadline set'
      : `Dispute deadline has passed (${deadline!.toISOString()}) — submission may be rejected by Stripe`,
  });

  const failedHard = checks.filter((c) => !c.passed);
  // Checks 1-8 and 10 are hard blocks. Check 9 (verification) is a warning only.
  // The deadline check (#10) is also a soft warning — Stripe may still accept late submissions.
  const hardBlockIndexes = [0, 1, 2, 3, 4, 5, 6, 7]; // 0-indexed checks 1-8
  const hardFails = checks.filter((_, i) => hardBlockIndexes.includes(i) && !checks[i].passed);

  const canApprove = hardFails.length === 0;

  const summary = canApprove
    ? `Approval gate passed (${checks.length} checks). ${failedHard.length > 0 ? `${failedHard.length} warning(s).` : 'No warnings.'}`
    : `Approval denied: ${hardFails.map((c) => c.reason).join('; ')}`;

  return { canApprove, checks, summary };
}
