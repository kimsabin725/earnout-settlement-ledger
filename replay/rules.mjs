// What the signed terms can hold, in one place.
//
// The harness compiles clause files with these rules; the clause self-check page
// (docs/clause-check.html) asks the same questions in words and has to reach the
// same verdict. `rules.test.mjs` drives the page through every combination of its
// answers and fails if the two ever disagree — a page that quietly says "refused"
// about a clause this model can hold is worse than no page.

const SUPPORTED = {
  periodBasis: ['per-period'],
  payoutType: ['all-or-nothing'],
  thresholdType: ['count-of-periods-met'],
};

export function check(clause) {
  const reasons = [];
  const t = clause.terms ?? {};
  const p = t.payout ?? {};
  if (!SUPPORTED.periodBasis.includes(t.periodBasis))
    reasons.push(`periodBasis "${t.periodBasis}" — the contract evaluates each period against a fixed target; a cumulative or catch-up basis would need the signed terms to carry running state, which they deliberately do not.`);
  if (!SUPPORTED.payoutType.includes(p.type))
    reasons.push(`payout type "${p.type}" — the tranche is all-or-nothing. Tiered, sliding, interpolated and formula payouts — the common shapes in the public record — are different computations and would have to be signed as such.`);
  if (p.type === 'all-or-nothing' && !SUPPORTED.thresholdType.includes(p.thresholdType ?? 'count-of-periods-met'))
    reasons.push(`threshold type "${p.thresholdType}" — the only threshold the contract counts is how many periods were met.`);
  if (t.trigger === 'event')
    reasons.push(`the trigger is an event (${t.eventDescription ?? 'a milestone'}), not a metric value. The contract compares a number to a target; an event needs a party who signs that the event happened, and the model has no template for that — MetricAttestation carries a figure, not a fact.`);
  if (Array.isArray(t.metrics) && t.metrics.length > 1)
    reasons.push(`${t.metrics.length} metrics — one metric per agreement. Two metrics means two agreements, or a metric defined as a formula before it reaches the ledger.`);
  if (t.caps || t.floors)
    reasons.push('caps/floors on the tranche — not expressible; the tranche amount is a single signed figure.');
  if (Array.isArray(t.metricTargetsByPeriod))
    reasons.push(`the target changes by period (${t.metricTargetsByPeriod.join(', ')}) — the signed terms carry one target for every period, so a rising or stepped target is a different contract.`);
  if (t.aggregation && t.aggregation !== 'per-period')
    reasons.push(`aggregation "${t.aggregation}" — the contract tests each period on its own and counts how many passed.`);
  const sched = clause.schedule ?? [];
  if (sched.length !== t.periods)
    reasons.push(`schedule has ${sched.length} periods but the terms declare ${t.periods}. The contract requires every period reported, in order, exactly once.`);
  sched.forEach((q) => {
    if (q.dispute) {
      const met = q.metricValue >= t.metricTarget;
      const flagged = !met && q.metricValue + (q.oneOffOutflows ?? 0) >= t.metricTarget;
      if (!flagged)
        reasons.push(`period ${q.period} records a dispute, but the ledger only allows a dispute on a flagged verdict (missed target, and the one-off outflows would have carried it). This clause's dispute happened for a reason the contract does not model.`);
    }
  });
  return reasons;
}

export { SUPPORTED };
