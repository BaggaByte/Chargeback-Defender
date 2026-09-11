import assert from 'assert';
import {
  createConnectedAccount,
  getConnectedAccountById,
  listConnectedAccounts,
  createDriver,
  getDriverById,
  createRider,
  getRiderById,
  createRide,
  getRideById,
  createDispute,
  getDisputeById,
} from '../src/db';
import { rideEvidenceCollector } from '../src/lib/integrations/ride-evidence-collector';
import { marketplaceLiabilityEngine } from '../src/lib/integrations/marketplace-liability-engine';
import { StripeAdapter } from '../src/lib/integrations/processor-formatters';
import { calculateEvidenceScore } from '../src/lib/scoring';
import { DisputeRecord, RideRecord, DriverRecord, RiderRecord, EvidenceItem } from '../src/lib/types';

const TEST_ORG = 'org-marketplace-test';
const TEST_ACTOR = {
  userId: 'user-risk-mgr',
  actorName: 'Lead Risk Analyst',
  actorRole: 'MANAGER',
  organizationId: TEST_ORG,
};

async function runRideMarketplaceTests() {
  console.log('\n🚕 Starting Ride-Marketplace Vertical Test Suite...\n');

  // =========================================================================
  // 1. Stripe Connected Account Creation
  // =========================================================================
  const connectedAcct = await createConnectedAccount(
    {
      organizationId: TEST_ORG,
      stripeAccountId: `acct_express_${Date.now()}`,
      email: 'driver.marcus@example.com',
      accountType: 'express',
      country: 'US',
      defaultCurrency: 'USD',
      chargesEnabled: true,
      payoutsEnabled: true,
      status: 'active',
    },
    TEST_ACTOR
  );

  assert.ok(connectedAcct.id, 'Connected account should have an ID');
  assert.equal(connectedAcct.accountType, 'express');
  assert.equal(connectedAcct.status, 'active');
  console.log('  ✅ PASS: 1. Stripe Connected Account created successfully');

  // Verify fetch and list
  const fetchedAcct = await getConnectedAccountById(connectedAcct.id, TEST_ORG);
  assert.equal(fetchedAcct?.id, connectedAcct.id);
  const acctList = await listConnectedAccounts(TEST_ORG);
  assert.ok(acctList.some((a) => a.id === connectedAcct.id));
  console.log('  ✅ PASS: 1.1 Connected Account retrieval and listing verified');

  // =========================================================================
  // 2. Driver & Rider Registration
  // =========================================================================
  const driver = await createDriver(
    {
      organizationId: TEST_ORG,
      connectedAccountId: connectedAcct.id,
      name: 'Marcus Vance',
      email: 'driver.marcus@example.com',
      phoneNumber: '+1-555-019-2834',
      licenseNumber: 'DL-NY-9823411',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry Hybrid',
      vehicleYear: 2023,
      vehiclePlate: 'NYC-RIDE-78',
      rating: 4.96,
      totalCompletedTrips: 1850,
      status: 'ACTIVE',
    },
    TEST_ACTOR
  );

  assert.ok(driver.id, 'Driver should have an ID');
  assert.equal(driver.rating, 4.96);
  assert.equal(driver.totalCompletedTrips, 1850);
  console.log('  ✅ PASS: 2. Marketplace Driver registered with vehicle and rating');

  const rider = await createRider(
    {
      organizationId: TEST_ORG,
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phoneNumber: '+1-555-014-9921',
      rating: 4.91,
      totalRidesCount: 34,
      fraudRiskScore: 4,
    },
    TEST_ACTOR
  );

  assert.ok(rider.id, 'Rider should have an ID');
  assert.equal(rider.fraudRiskScore, 4);
  console.log('  ✅ PASS: 2.1 Marketplace Rider registered with fraud telemetry');

  // =========================================================================
  // 3. Ride Creation & Telemetry Logging
  // =========================================================================
  const ride = await createRide(
    {
      organizationId: TEST_ORG,
      driverId: driver.id,
      riderId: rider.id,
      status: 'COMPLETED',
      pickupAddress: 'Penn Station, 8th Ave, New York, NY',
      pickupLatitude: 40.7505,
      pickupLongitude: -73.9934,
      dropoffAddress: 'JFK Airport Terminal 4, Queens, NY',
      dropoffLatitude: 40.6437,
      dropoffLongitude: -73.7820,
      pickupTimestamp: new Date(Date.now() - 3600000).toISOString(),
      dropoffTimestamp: new Date(Date.now() - 1200000).toISOString(),
      fareAmount: 68.5,
      platformFee: 13.7,
      driverEarnings: 54.8,
      tipAmount: 10.0,
      currency: 'USD',
      distanceMiles: 17.8,
      durationMinutes: 40,
      otpVerified: true,
      routePolylineHash: 'SHA256:4a8b79e19034f828a7e0',
      stripeChargeId: 'ch_ride_test_001',
      stripePaymentIntentId: 'pi_ride_test_001',
      stripeTransferId: 'tr_driver_test_001',
      telemetry: {
        destinationReached: true,
        geofenceProximityMeters: 14,
        riderDeviceIp: '198.51.100.44',
        riderAppSessionId: 'sess_elena_mobile_ios',
      },
    },
    TEST_ACTOR
  );

  assert.ok(ride.id, 'Ride should have an ID');
  assert.equal(ride.fareAmount, 68.5);
  assert.equal(ride.driverEarnings, 54.8);
  assert.equal(ride.otpVerified, true);
  console.log('  ✅ PASS: 3. Completed ride recorded with GPS, fare split, and OTP');

  // =========================================================================
  // 4. Compelling Evidence Collection
  // =========================================================================
  const testDisputeId = `dsp-test-ride-${Date.now()}`;
  const evidencePkg = rideEvidenceCollector.collectEvidence({
    disputeId: testDisputeId,
    ride,
    driver,
    rider,
  });

  assert.equal(evidencePkg.evidenceItems.length, 4, 'Should collect 4 compelling evidence items');
  const types = evidencePkg.evidenceItems.map((e) => e.type);
  assert.ok(types.includes('TRIP_GPS_LOG'), 'Should include TRIP_GPS_LOG');
  assert.ok(types.includes('RIDE_COMPLETION_CONFIRMATION'), 'Should include RIDE_COMPLETION_CONFIRMATION');
  assert.ok(types.includes('DRIVER_VERIFICATION'), 'Should include DRIVER_VERIFICATION');
  assert.ok(types.includes('RIDER_SESSION_CORRELATION'), 'Should include RIDER_SESSION_CORRELATION');

  assert.ok(evidencePkg.tripGpsEvidence.includes('Penn Station'));
  assert.ok(evidencePkg.tripGpsEvidence.includes('JFK Airport'));
  assert.ok(evidencePkg.tripGpsEvidence.includes('14 meters'));
  assert.ok(evidencePkg.driverVerificationEvidence.includes('Marcus Vance'));
  assert.ok(evidencePkg.driverVerificationEvidence.includes('4.96'));
  console.log('  ✅ PASS: 4. RideEvidenceCollector produced full CE 3.0 transportation evidence');

  // =========================================================================
  // 5. Stripe Evidence Formatter
  // =========================================================================
  const stripeAdapter = new StripeAdapter();
  const formattedItems: EvidenceItem[] = evidencePkg.evidenceItems.map((item, i) => ({
    ...item,
    id: `ev-${i}`,
    createdAt: new Date().toISOString(),
  }));

  const stripeEvidence = stripeAdapter.formatEvidence(formattedItems);
  assert.ok(stripeEvidence.service_documentation, 'Should populate service_documentation for Stripe');
  assert.ok(stripeEvidence.access_activity_log, 'Should populate access_activity_log for rider telemetry');
  assert.ok(stripeEvidence.receipt, 'Should populate receipt for ride payment');
  console.log('  ✅ PASS: 5. StripeAdapter formatted ride evidence to Stripe dispute schema');

  // =========================================================================
  // 6. Evidence Scoring Engine
  // =========================================================================
  const mockDispute: DisputeRecord = {
    id: testDisputeId,
    organizationId: TEST_ORG,
    orderId: 'ord-dummy',
    customerId: 'cust-dummy',
    externalDisputeId: 'dp_ride_dispute_001',
    processor: 'stripe',
    processorDisputeId: 'dp_stripe_ride_001',
    reason: 'fraudulent',
    reasonCode: '10.4',
    amount: 68.5,
    feeAmount: 15.0,
    currency: 'USD',
    status: 'OPEN',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    riskLevel: 'MEDIUM',
    cardBrand: 'visa',
    cardLast4: '4242',
    cardholderName: 'Elena Rostova',
    evidenceStrengthScore: 0,
    winProbability: 0,
    rebuttalLetter: '',
    rebuttalTone: 'firm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scoring = calculateEvidenceScore(mockDispute, formattedItems);
  assert.ok(scoring.score >= 85, `Evidence score should be strong (got ${scoring.score})`);
  console.log(`  ✅ PASS: 6. Scoring engine evaluated ride evidence strength (${scoring.score}/100)`);

  // =========================================================================
  // 7. Marketplace Liability Engine: Case A (Legitimate Service)
  // =========================================================================
  const legitEvaluation = marketplaceLiabilityEngine.evaluateLiability({
    dispute: mockDispute,
    ride,
    driver,
    rider,
  });

  assert.equal(legitEvaluation.recommendedAction, 'DEFEND_COMPENSATE');
  assert.equal(legitEvaluation.reversalRequired, false);
  assert.equal(legitEvaluation.driverLiabilityAmount, 0);
  console.log('  ✅ PASS: 7. Liability Engine Case A (Legitimate Ride -> Defend with CE 3.0, Driver Protected)');

  // =========================================================================
  // 8. Marketplace Liability Engine: Case B (Driver Misconduct / Route Deviation)
  // =========================================================================
  const badRide: RideRecord = {
    ...ride,
    id: 'ride-deviated',
    status: 'COMPLETED',
    telemetry: {
      destinationReached: false,
      geofenceProximityMeters: 1200, // 1.2km away from destination
      routeDeviationFlag: true,
    },
  };

  const driverFaultEvaluation = marketplaceLiabilityEngine.evaluateLiability({
    dispute: mockDispute,
    ride: badRide,
    driver,
    rider,
  });

  assert.equal(driverFaultEvaluation.liability, 'DRIVER');
  assert.equal(driverFaultEvaluation.recommendedAction, 'REVERSE_DRIVER_TRANSFER');
  assert.equal(driverFaultEvaluation.reversalRequired, true);
  assert.equal(driverFaultEvaluation.driverLiabilityAmount, ride.driverEarnings);
  console.log('  ✅ PASS: 8. Liability Engine Case B (Driver Deviation -> Reversal from Driver Account)');

  // =========================================================================
  // 9. Marketplace Liability Engine: Case C (Rider Account Takeover / ATO)
  // =========================================================================
  const compromisedRider: RiderRecord = {
    ...rider,
    id: 'rider-hacked',
    fraudRiskScore: 92, // Compromised account
  };

  const atoEvaluation = marketplaceLiabilityEngine.evaluateLiability({
    dispute: mockDispute,
    ride,
    driver,
    rider: compromisedRider,
  });

  assert.equal(atoEvaluation.liability, 'PLATFORM');
  assert.equal(atoEvaluation.recommendedAction, 'ABSORB_PLATFORM_LOSS');
  assert.equal(atoEvaluation.reversalRequired, false);
  assert.equal(atoEvaluation.platformLiabilityAmount, mockDispute.amount);
  console.log('  ✅ PASS: 9. Liability Engine Case C (Rider Account Takeover -> Platform Absorbs Loss)');

  // =========================================================================
  // 10. End-to-End Execution of Transfer Reversal & Dispute Liability
  // =========================================================================
  // Create an actual dispute in DB to test execution
  const dbDispute = await createDispute({
    organizationId: TEST_ORG,
    customerEmail: rider.email,
    customerName: rider.name,
    externalDisputeId: `dp_ext_${Date.now()}`,
    processor: 'stripe',
    reason: 'fraudulent',
    amount: 68.5,
  });

  const resolutionResult = await marketplaceLiabilityEngine.executeLiabilityResolution({
    disputeId: dbDispute.id,
    orgId: TEST_ORG,
    evaluation: driverFaultEvaluation,
    ride: badRide,
    driver,
    auditActor: TEST_ACTOR,
  });

  assert.ok(resolutionResult.transferReversalId, 'Should generate a transfer reversal ID');
  assert.ok(resolutionResult.transferReversalId.startsWith('trr_'));
  assert.equal(resolutionResult.dispute?.liabilityType, 'DRIVER');
  assert.equal(resolutionResult.dispute?.driverLiabilityAmount, ride.driverEarnings);
  assert.equal(resolutionResult.dispute?.transferReversalId, resolutionResult.transferReversalId);
  console.log('  ✅ PASS: 10. E2E Liability Execution logged transfer reversal and assigned liability in DB');

  console.log('\n========================================');
  console.log('Results: 10 passed, 0 failed');
  console.log('========================================\n');
}

runRideMarketplaceTests().catch((err) => {
  console.error('\n❌ Test failed with error:\n', err);
  process.exit(1);
});
