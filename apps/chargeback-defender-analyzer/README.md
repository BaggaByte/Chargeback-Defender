# Chargeback Defender — Dispute Analyzer

Paste a payment dispute's order, transaction, and evidence data as JSON and get:

- A win-probability score
- An evidence-strength score
- The list of evidence types still missing
- A draft rebuttal letter formatted for the acquiring bank

Scoring is based on Visa Compelling Evidence 3.0 and Mastercard Compelling
Evidence 2.0 factors: 3-D Secure authentication, AVS/CVC match, signed
proof of delivery, verified customer session correlation, and TOS
acceptance.

This is the RocketRide-native front end for the full Chargeback Defender
platform (github.com/BaggaByte/Chargeback-Defender), which also handles
Stripe webhook ingestion, human-in-the-loop approval, and processor
submission.
