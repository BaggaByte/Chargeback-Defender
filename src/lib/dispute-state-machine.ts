/**
 * Dispute Lifecycle State Machine
 * Single server-side source of truth for dispute statuses and transitions.
 */

export const DISPUTE_STATUSES = [
  // Canonical Lifecycle States
  'RECEIVED',
  'PROCESSING',
  'EVIDENCE_READY',
  'AI_ANALYZED',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUBMITTED',
  'RESOLVED',
  'FAILED',

  // Backwards compatibility aliases with existing codebase / seed data
  'OPEN',                // Alias/equivalent to RECEIVED
  'EVIDENCE_COLLECTING', // Alias/equivalent to PROCESSING
  'PENDING_APPROVAL',    // Alias/equivalent to NEEDS_REVIEW
  'WON',                 // Terminal win outcome
  'LOST',                // Terminal loss outcome
  'EXPIRED',             // Terminal expired outcome
] as const;

export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export class InvalidDisputeStateTransitionError extends Error {
  public fromStatus: string;
  public toStatus: string;

  constructor(fromStatus: string, toStatus: string, customMessage?: string) {
    super(
      customMessage ||
        `Invalid dispute state transition: cannot transition dispute from '${fromStatus}' to '${toStatus}'.`
    );
    this.name = 'InvalidDisputeStateTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

/**
 * Transition rules definition.
 * Defines allowed next states for every given state.
 */
export const ALLOWED_TRANSITIONS: Record<DisputeStatus, readonly DisputeStatus[]> = {
  // Initial state upon ingestion
  RECEIVED: ['PROCESSING', 'EVIDENCE_COLLECTING', 'FAILED', 'REJECTED'],
  OPEN: ['PROCESSING', 'EVIDENCE_COLLECTING', 'EVIDENCE_READY', 'NEEDS_REVIEW', 'PENDING_APPROVAL', 'FAILED', 'REJECTED'],

  // Ingestion & evidence collection in progress
  PROCESSING: ['EVIDENCE_READY', 'NEEDS_REVIEW', 'PENDING_APPROVAL', 'FAILED'],
  EVIDENCE_COLLECTING: ['EVIDENCE_READY', 'NEEDS_REVIEW', 'PENDING_APPROVAL', 'FAILED'],

  // Evidence collected, ready for AI evaluation
  EVIDENCE_READY: ['AI_ANALYZED', 'NEEDS_REVIEW', 'PENDING_APPROVAL', 'FAILED'],

  // AI evaluation complete, awaiting operator review
  AI_ANALYZED: ['NEEDS_REVIEW', 'PENDING_APPROVAL', 'FAILED'],

  // Human review / triage gate
  NEEDS_REVIEW: ['APPROVED', 'REJECTED', 'SUBMITTED', 'PROCESSING', 'EVIDENCE_COLLECTING'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'SUBMITTED', 'PROCESSING', 'EVIDENCE_COLLECTING'],

  // Operator approved evidence packet
  APPROVED: ['SUBMITTED', 'REJECTED'],

  // Operator or system rejected dispute defense (conceding dispute)
  REJECTED: ['RESOLVED', 'LOST'],

  // Evidence submitted to payment processor/acquiring bank
  SUBMITTED: ['RESOLVED', 'WON', 'LOST', 'EXPIRED'],

  // Terminal resolution states
  RESOLVED: [],
  WON: [],
  LOST: [],
  EXPIRED: [],

  // Failure recovery: failed operations can be retried into processing or back to received
  FAILED: ['PROCESSING', 'EVIDENCE_COLLECTING', 'RECEIVED', 'OPEN'],
};

/**
 * Checks if a transition between two dispute statuses is permitted.
 */
export function canTransitionDispute(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) {
    return true; // Idempotent transition is always permitted
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus as DisputeStatus];
  if (!allowed) {
    return false;
  }

  return allowed.includes(toStatus as DisputeStatus);
}

/**
 * Validates a transition and throws an InvalidDisputeStateTransitionError if invalid.
 */
export function validateDisputeTransition(fromStatus: string, toStatus: string): void {
  if (!canTransitionDispute(fromStatus, toStatus)) {
    throw new InvalidDisputeStateTransitionError(fromStatus, toStatus);
  }
}

/**
 * Returns whether a status is considered terminal (no further transitions possible).
 */
export function isTerminalStatus(status: string): boolean {
  return ['RESOLVED', 'WON', 'LOST', 'EXPIRED'].includes(status);
}

/**
 * Returns human-readable metadata for a dispute status.
 */
export function getStatusMetadata(status: string): {
  label: string;
  category: 'intake' | 'processing' | 'review' | 'submitted' | 'resolved' | 'error';
} {
  switch (status) {
    case 'RECEIVED':
    case 'OPEN':
      return { label: 'Open Intake', category: 'intake' };
    case 'PROCESSING':
    case 'EVIDENCE_COLLECTING':
      return { label: 'Gathering Evidence', category: 'processing' };
    case 'EVIDENCE_READY':
      return { label: 'Evidence Ready', category: 'processing' };
    case 'AI_ANALYZED':
      return { label: 'AI Analyzed', category: 'processing' };
    case 'NEEDS_REVIEW':
    case 'PENDING_APPROVAL':
      return { label: 'Pending Review', category: 'review' };
    case 'APPROVED':
      return { label: 'Approved', category: 'review' };
    case 'REJECTED':
      return { label: 'Conceded / Rejected', category: 'resolved' };
    case 'SUBMITTED':
      return { label: 'Submitted to Gateway', category: 'submitted' };
    case 'RESOLVED':
    case 'WON':
      return { label: 'Won', category: 'resolved' };
    case 'LOST':
      return { label: 'Lost', category: 'resolved' };
    case 'EXPIRED':
      return { label: 'Expired', category: 'resolved' };
    case 'FAILED':
      return { label: 'Pipeline Failed', category: 'error' };
    default:
      return { label: status, category: 'intake' };
  }
}
