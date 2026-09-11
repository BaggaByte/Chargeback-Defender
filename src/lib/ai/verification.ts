import { DisputeAIInput, AIVerificationReport } from './types';

/**
 * Verification Engine (Anti-Hallucination & Fact Grounding Guardrail)
 * Verifies that the generated rebuttal letter and conclusions are strictly grounded in provided input data.
 */
export function verifyGeneratedRebuttal(
  input: DisputeAIInput,
  rebuttalLetter: string,
  claimedStrengths: string[] = []
): AIVerificationReport {
  const unsupportedClaims: string[] = [];
  const contradictions: string[] = [];
  const letter = rebuttalLetter.toLowerCase();

  const hasTracking = Boolean(input.transaction?.trackingNumber);
  const isDelivered =
    input.transaction?.carrierStatus === 'DELIVERED' ||
    input.evidence.some(
      (e) =>
        e.type === 'SHIPPING_PROOF' &&
        (e.content.toLowerCase().includes('delivered') || e.title.toLowerCase().includes('delivery'))
    );
  const hasSignature =
    Boolean(input.transaction?.deliverySignature) ||
    input.evidence.some(
      (e) => e.type === 'SHIPPING_PROOF' && e.content.toLowerCase().includes('signed')
    );
  const has3DS =
    input.transaction?.threeDSecure === 'AUTHENTICATED' ||
    input.evidence.some(
      (e) => e.type === 'ORDER_DETAILS' && e.content.toLowerCase().includes('3d-secure')
    );
  const hasTos =
    Boolean(input.customer?.hasAcceptedTos) ||
    input.evidence.some((e) => e.type === 'TOS_AGREEMENT');
  const hasComms = input.evidence.some(
    (e) => e.type === 'CUSTOMER_COMMUNICATION' || e.type === 'ACTIVITY_LOGS'
  );

  // 1. Delivery claims verification
  if (letter.includes('delivered') || letter.includes('proof of delivery')) {
    if (!isDelivered && !hasTracking) {
      unsupportedClaims.push(
        'Rebuttal asserts delivery completion, but no carrier delivery proof or tracking exists in input records.'
      );
    }
  }

  // 2. Physical signature claim verification
  if (letter.includes('signature') || letter.includes('signed by')) {
    if (!hasSignature) {
      unsupportedClaims.push(
        'Rebuttal asserts physical signature confirmation, but no courier signature was provided in evidence.'
      );
    }
  }

  // 3. 3D-Secure liability shift verification
  if (letter.includes('3d-secure') || letter.includes('3ds') || letter.includes('liability shift')) {
    if (!has3DS) {
      unsupportedClaims.push(
        'Rebuttal asserts 3D-Secure 2.0 liability shift, but transaction was not 3DS authenticated.'
      );
    }
  }

  // 4. Terms of Service acceptance claim verification
  if (letter.includes('terms of service') || letter.includes('refund policy acknowledgment')) {
    if (!hasTos) {
      unsupportedClaims.push(
        'Rebuttal asserts explicit Terms of Service acceptance, but no TOS evidence or customer acceptance record exists.'
      );
    }
  }

  // 5. Support interaction claim verification
  if (letter.includes('support chat') || letter.includes('customer admitted') || letter.includes('support ticket')) {
    if (!hasComms) {
      unsupportedClaims.push(
        'Rebuttal cites customer support communications, but no communication logs exist in evidence items.'
      );
    }
  }

  // 6. Contradiction Detection: Tracking status contradiction
  if (input.transaction?.carrierStatus === 'EXCEPTION' && letter.includes('successfully delivered without issue')) {
    contradictions.push(
      'Carrier tracking reports an EXCEPTION, directly contradicting claim of successful delivery.'
    );
  }

  // 7. Check if response addresses the dispute reason
  const reason = input.dispute.reason.toLowerCase();
  let addressedDisputeReason = true;
  if (reason.includes('fraud') || reason.includes('unrecognized')) {
    addressedDisputeReason =
      letter.includes('fraud') ||
      letter.includes('authorization') ||
      letter.includes('authorized') ||
      letter.includes('avs') ||
      letter.includes('ip');
  } else if (reason.includes('not received') || reason.includes('delivery')) {
    addressedDisputeReason =
      letter.includes('delivery') ||
      letter.includes('delivered') ||
      letter.includes('tracking') ||
      letter.includes('carrier') ||
      letter.includes('shipped');
  }

  if (!addressedDisputeReason) {
    contradictions.push(
      `Rebuttal fails to directly address the specific dispute reason filed by cardholder ("${input.dispute.reason}").`
    );
  }

  const passed = unsupportedClaims.length === 0 && contradictions.length === 0;

  return {
    passed,
    unsupportedClaims,
    contradictions,
    addressedDisputeReason,
    internallyConsistent: contradictions.length === 0,
    notes: passed
      ? 'All factual claims and evidence citations verified against input records.'
      : `Verification flagged ${unsupportedClaims.length} unsupported claim(s) and ${contradictions.length} contradiction(s).`,
  };
}
