# PATCHFLOW commercial model — proposal

## Target and adoption
Primary: freelance audio/video operators who prepare a wiring diagram for each event. Buyer value: fewer patch mistakes, reusable diagrams, clear handoff to venue and production staff. Secondary: small production/rental teams; validate member permissions before selling a Team license.

Activation: create a diagram with 3 devices and 2 valid connections, name the project, export or share it. First project starts without login; account creation is requested when saving across devices. Pricing never interrupts an active patch operation.

## Proposed offers (JPY, tax treatment not finalized)
Free: browser editing and JSON portability. Pro: 980/month or 9,800/year; cloud project workflow, exports, sharing. Team: 2,980/month or 29,800/year for 3 seats, only after member permissions and shared templates exist. No current features have been paywalled. Do not sell planned features as available.

14-day Pro trial: no card, one per authenticated account, no automatic paid conversion. Expiration returns to Free while preserving data and allowing JSON export. A paid subscription requires a separate explicit Checkout action; do not attach payment methods to a card-free trial and silently convert it. Trial state must be server-owned and persisted atomically.

## Discounts
LAUNCH20 currently exists ONLY in the public quote calculator, not as a redeemable purchase code. Proposed commercial campaign: 20% off the first billing period; annual selection discounts the first year, monthly selection the first month. Display renewal amount before purchase. Set explicit start/end times, eligible Price IDs, maximum redemption count and account-level eligibility in Stripe/server validation. Never trust browser totals or coupon flags as entitlements. Avoid lifetime discounts before retention is known.

## Stripe implementation contract
Use hosted Checkout for explicit purchase and Billing Customer Portal for payment changes/cancellation. Price IDs and return URLs must be server-controlled. Authenticate with Sites identity; customer-to-user mappings must be unique and server-owned. Checkout completion pages do not grant access. Verify webhook signatures from the raw request body, deduplicate event IDs, and reconcile current subscription state from Stripe to handle delayed/out-of-order events. Active/trialing are eligible; failed payment policy and grace period require explicit product decisions. Protect checkout creation against duplicate concurrent subscriptions and use idempotency keys. Keep test and live credentials/data separate. No actual charging is currently enabled.

Configuration needed: Stripe test secret key, webhook signing secret, four test recurring Price IDs (Pro/Team monthly/yearly; Team sales disabled until implemented), configured Customer Portal. Store secrets through runtime secret settings, never Git or browser JS. Validate test purchase, cancellation, renewal/failure and coupon behavior before enabling live mode. Confirm published price/tax terms before live sales.

## Rollout and measurement
1. Current: adoption/pricing proposal, quote calculator and downloadable estimate.
2. Private test: authenticated trial ledger, Stripe test Checkout/Portal, signed webhook reconciliation, billing UI and entitlement checks.
3. Paid pilot: Pro only, explicit published terms and tax treatment, recovery/export paths verified.
4. Team: only after member lifecycle and roles are implemented and tested.

Measure activated projects, weekly retained creators, exports/shared diagrams per activated account, trial-to-paid conversion, paid churn and support incidents. Collect minimal aggregate events; do not capture diagram content or equipment notes as analytics. Review prices after real willingness-to-pay interviews; proposed figures are hypotheses, not market comparisons.
