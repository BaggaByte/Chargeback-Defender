import { EvidenceItem } from '@/lib/types';

export interface StripeEvidenceFormat {
  customer_name?: string;
  customer_email_address?: string;
  customer_purchase_ip?: string;
  shipping_address?: string;
  shipping_date?: string;
  shipping_carrier?: string;
  shipping_tracking_number?: string;
  receipt?: string;
  customer_communication?: string;
  access_activity_log?: string;
  uncategorized_text?: string;
}

export class StripeAdapter {
  formatEvidence(evidenceList: EvidenceItem[]): StripeEvidenceFormat {
    console.log(`[StripeAdapter] Formatting ${evidenceList.length} evidence items for Stripe...`);
    
    const formatted: StripeEvidenceFormat = {};
    const uncategorized: string[] = [];

    for (const ev of evidenceList) {
      if (!ev.isIncludedInSubmission) continue;

      switch (ev.type) {
        case 'ORDER_DETAILS':
          formatted.receipt = ev.content;
          break;
        case 'SHIPPING_PROOF':
          // We can parse the content if it's structured, or just put it in uncategorized/tracking
          formatted.shipping_tracking_number = 'See details'; // simplified
          formatted.uncategorized_text = (formatted.uncategorized_text || '') + '\n' + ev.content;
          break;
        case 'CUSTOMER_COMMUNICATION':
          formatted.customer_communication = ev.content;
          break;
        default:
          uncategorized.push(`[${ev.title}]: ${ev.content}`);
      }
    }

    if (uncategorized.length > 0) {
      formatted.uncategorized_text = (formatted.uncategorized_text ? formatted.uncategorized_text + '\n\n' : '') + uncategorized.join('\n\n');
    }

    return formatted;
  }
}
