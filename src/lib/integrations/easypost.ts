// Mock EasyPost Adapter

export interface TrackingInfo {
  trackingCode: string;
  carrier: string;
  status: string;
  deliveryDate: string | null;
  signature: string | null;
  gpsCoordinates: {
    lat: number;
    lng: number;
  } | null;
}

export class EasypostAdapter {
  async fetchTracking(trackingCode: string): Promise<TrackingInfo> {
    console.log(`[EasypostAdapter] Fetching tracking info for ${trackingCode}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      trackingCode,
      carrier: 'FedEx',
      status: 'delivered',
      deliveryDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      signature: 'Signed by A. Ross at front desk',
      gpsCoordinates: {
        lat: 40.7128,
        lng: -74.0060
      }
    };
  }

  formatAsEvidence(tracking: TrackingInfo): string {
    return `Carrier Tracking & Delivery Confirmation:
Carrier: ${tracking.carrier}
Tracking Number: ${tracking.trackingCode}
Status: ${tracking.status.toUpperCase()}
Delivered At: ${tracking.deliveryDate ? new Date(tracking.deliveryDate).toLocaleString() : 'N/A'}
Signature Details: ${tracking.signature ?? 'No signature required'}
GPS Coordinates at Delivery: ${tracking.gpsCoordinates ? `${tracking.gpsCoordinates.lat}, ${tracking.gpsCoordinates.lng}` : 'N/A'}`;
  }
}
