export type Protocol = {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
};

const DAY = 86_400_000;
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

function groupFactor(category: string | null): number {
  const value = (category || '').toLowerCase();
  // Plausibility uses the category field alone. Custodial exchanges, bridges,
  // and liquid-staking wrappers have little plausible on-chain launch activity;
  // farmable DeFi categories retain a neutral or positive multiplier.
  if (/\bcex\b/.test(value)) return 0.003;
  if (/bridge/.test(value)) return 0.003;
  if (/liquid staking|restaked btc/.test(value)) return 0.02;
  if (/liquid restaking/.test(value)) return 0.55;
  if (/dex|lending|perp|derivative|options|restak|yield|farm|vault|cdp|stablecoin|risk curator|rwa|collateral|synthetic|insurance|prediction|launchpad|ai|staking pool/.test(value)) return 1.05;
  return 0.85;
}

type PlanContext = {
  primary: string;
  secondary: string;
  category: string;
  valueBand: string;
  ageWeeks: number;
  feeRange: string;
  name: string;
};

function planContext(protocol: Protocol, ageDays: number): PlanContext {
  const primary = protocol.chains[0] || 'the listed primary network';
  const secondary = protocol.chains.find(chain => chain !== primary) || primary;
  const tvl = protocol.tvl_usd;
  const valueBand = tvl >= 1_000_000_000
    ? 'large TVL footprint; keep test size very small'
    : tvl >= 100_000_000
      ? 'mid-to-large TVL footprint; cap test size'
      : 'smaller TVL footprint; avoid concentrating funds';
  const feeRange = /solana|tron|ton|sui/i.test(primary)
    ? '$0.10–$4'
    : /ethereum/i.test(primary)
      ? '$3–$25'
      : '$0.50–$12';

  return {
    primary,
    secondary,
    category: (protocol.category || '').toLowerCase(),
    valueBand,
    ageWeeks: clamp(Math.ceil(ageDays / 7), 1, 52),
    feeRange,
    name: protocol.name
  };
}

function categoryActions(context: PlanContext): string[] {
  const { primary, secondary, category, name, feeRange, valueBand, ageWeeks } = context;
  const reviewWindow = Math.min(8, Math.max(3, Math.ceil(ageWeeks / 4)));

  if (/dex|exchange|swap/.test(category)) {
    return [
      `On ${primary}, make a low-value swap through ${name} in a liquid native/stable pair; budget ${feeRange} in network and venue fees, about 15 minutes once.`,
      `If the pool is deep enough, add a small amount to a volatile/stable LP on ${primary}; reserve $5–$30 for entry and exit fees and 25 minutes weekly for ${reviewWindow} weeks.`,
      `Check pool depth, fee tier and impermanent-loss exposure before adding; this ${valueBand}. Spend 10 minutes weekly, with $0–$5 for checks.`,
      `After ${reviewWindow} weeks, withdraw or rebalance only if the position still fits your risk limit; budget ${feeRange} and 15 minutes. No snapshot data establishes future rewards.`
    ];
  }

  if (/lending|credit|collateral|cdp|money market/.test(category)) {
    return [
      `Supply a small, withdrawable asset to ${name} on ${primary}; check the market and supplied-asset contract first, budget ${feeRange}, and allow 20 minutes for setup.`,
      `Only if borrowing is supported and the health factor stays conservative, borrow a tiny amount and repay it on ${primary}; budget $3–$25 and 20 minutes weekly for ${reviewWindow} weeks.`,
      `Review utilization, oracle source, liquidation threshold and withdrawal terms each week; set aside $0–$5 and 10 minutes. ${valueBand}.`,
      `At the end of ${reviewWindow} weeks, withdraw a small test portion to confirm the exit path; budget ${feeRange} and 15 minutes. The snapshot records no incentive promise.`
    ];
  }

  if (/perp|derivative|option/.test(category)) {
    return [
      `On ${primary}, open then close one minimum-size ${name} position without leverage, if available in your region; budget $2–$20 in trading fees and 20 minutes.`,
      `Test a limit order and its cancellation with a deliberately small notional; budget $2–$15 for executions and 15 minutes weekly for ${reviewWindow} weeks.`,
      `Before repeating, inspect funding, liquidation rules, oracle behavior and open interest; spend 10 minutes weekly and $0–$5. ${valueBand}.`,
      `Keep a written loss cap and close the test position within ${reviewWindow} weeks; reserve $2–$20 plus ${feeRange} for the close. No reward or token plan is present in the snapshot.`
    ];
  }

  if (/risk curator|curator|vault/.test(category)) {
    return [
      `Inspect ${name}'s vault mandate, accepted collateral and curator permissions on ${primary} before depositing; allow 20 minutes and budget ${feeRange} for a small test.`,
      `If withdrawals are open and the strategy is understood, deposit a modest amount into one vault and record its share balance; budget ${feeRange} and 20 minutes.`,
      `Review collateral concentration, oracle choices, caps and emergency controls weekly for ${reviewWindow} weeks; allow 15 minutes and $0–$5. ${valueBand}.`,
      `Test a partial withdrawal after ${reviewWindow} weeks, only if liquidity permits; reserve ${feeRange} and 15 minutes. Snapshot TVL does not verify vault safety, points, or an airdrop.`
    ];
  }

  if (/rwa|real world/.test(category)) {
    return [
      `Read ${name}'s eligibility, jurisdiction, redemption windows and issuer documents before using it on ${primary}; budget $0 and 30 minutes for review.`,
      `If legally eligible and terms are clear, make only a minimum-size subscription or transfer; reserve ${feeRange} plus any disclosed issuer fee and 30 minutes.`,
      `Track settlement, redemption dates and custodian disclosures weekly for ${reviewWindow} weeks; spend 15 minutes and $0–$5. ${valueBand}.`,
      `Request a small redemption test when permitted and log the actual delay and cost; allow ${feeRange} and 30 minutes. TVL is not proof of access or token incentives.`
    ];
  }

  if (/yield|farm|aggregator/.test(category)) {
    return [
      `Compare ${name}'s stated strategy and underlying venues on ${primary}; make a small deposit only after checking approvals, budget ${feeRange}, and allow 20 minutes.`,
      `Record the vault share balance and net quoted yield, then compare with its underlying pool; spend 15 minutes weekly for ${reviewWindow} weeks and $0–$5.`,
      `Check strategy exposure, performance fees, withdrawal queue and contract permissions before compounding; ${valueBand}. Allow 15 minutes and ${feeRange} if transacting.`,
      `Withdraw a small portion after ${reviewWindow} weeks if terms allow, then compare received assets with the deposit; reserve ${feeRange} and 20 minutes. No airdrop is evidenced.`
    ];
  }

  if (/restak|staking|stake/.test(category)) {
    return [
      `Inspect ${name}'s validator, operator and slashing disclosures on ${primary}; spend 20 minutes and $0 before committing assets.`,
      `If lockup and withdrawal terms are acceptable, stake or restake a small test amount on ${primary}; budget ${feeRange} and 25 minutes for setup.`,
      `Track unlock timing, queued exits, rewards accounting and slashing exposure weekly for ${reviewWindow} weeks; allow 15 minutes and $0–$5. ${valueBand}.`,
      `Rehearse an unstake or withdrawal with a small position when available; reserve ${feeRange} and 20 minutes. The snapshot does not establish points or a token plan.`
    ];
  }

  if (/bridge|cross-chain/.test(category)) {
    return [
      `Verify ${name}'s official route and supported assets before moving a test amount from ${primary} to ${secondary}; budget $3–$25 in bridge and gas fees and 25 minutes.`,
      `Wait for the route's stated finality, then confirm the receiving balance before any second transfer; allow 20 minutes and another $3–$25 only if needed.`,
      `Review pause controls, validator model, asset mapping and allowance status weekly for ${reviewWindow} weeks; spend 10 minutes and $0–$5. ${valueBand}.`,
      `Return a small amount only after checking current liquidity and route status; reserve $3–$25 and 20 minutes. Bridge activity is not evidence of a farmable launch.`
    ];
  }

  if (/stablecoin|payments|payment/.test(category)) {
    return [
      `Check ${name}'s issuer, reserve, redemption and freeze disclosures before acquiring a test amount on ${primary}; allow 20 minutes and $0–$5 for checks.`,
      `If supported, make one small transfer to a second listed network, ${secondary}, and verify receipt; budget ${feeRange} and 20 minutes.`,
      `Review peg behavior, liquidity depth and redemption access weekly for ${reviewWindow} weeks; spend 10 minutes and $0–$5. ${valueBand}.`,
      `Test redemption or conversion with a small balance after ${reviewWindow} weeks; reserve ${feeRange} and 20 minutes. Snapshot TVL proves neither reserves nor future rewards.`
    ];
  }

  return [
    `Read ${name}'s official documentation and identify its core user action on ${primary}; spend 20 minutes and $0 before connecting a wallet.`,
    `If the action is available and contract permissions are clear, perform one minimum-size test interaction; budget ${feeRange} and 20 minutes.`,
    `Review transaction history, withdrawal path and protocol risk each week for ${reviewWindow} weeks; allow 15 minutes and $0–$5. ${valueBand}.`,
    `Repeat on ${secondary} only when it is listed as supported and the first test settled correctly; reserve ${feeRange} and 20 minutes. Activity is research, not an airdrop promise.`
  ];
}

function plan(protocol: Protocol, ageDays: number): string[] {
  const context = planContext(protocol, ageDays);
  const steps = categoryActions(context);
  // Bind the final guidance to the observed age and TVL so plans differ when
  // protocols share a category but have different histories or scale.
  const tenureNote = ageDays > 730
    ? ` ${protocol.name} has been tracked for ${Math.round(ageDays)} days; prioritize checking current terms over assuming an old position still qualifies.`
    : ` ${protocol.name} has ${Math.round(ageDays)} tracked days in this snapshot; history length alone does not establish eligibility.`;
  const scaleNote = ` Snapshot TVL is $${Math.round(protocol.tvl_usd).toLocaleString('en-US')}; use it only as scale context, not as a measure of your likely return.`;
  steps[steps.length - 1] += tenureNote + scaleNote;
  return steps;
}

export function buildBoard(protocols: Protocol[], watchlist: string[], asOf: string) {
  const watch = new Set(watchlist);
  const date = Date.parse(`${asOf}T00:00:00Z`);
  const candidates = protocols.filter(protocol => protocol.gecko_id == null && protocol.symbol == null);
  const records = candidates.map(protocol => {
    const listedDate = protocol.listed_at
      ? Date.parse(`${protocol.listed_at}T00:00:00Z`)
      : Number.NaN;
    const days = Number.isFinite(listedDate) ? Math.max(0, (date - listedDate) / DAY) : 0;
    const base = protocol.tvl_usd * 0.08;
    const growth = clamp(1 + clamp(protocol.change_7d ?? 0, -50, 50) / 100 * 0.5, 0.75, 1.25);
    const tenure = clamp(0.65 + Math.log1p(days) / Math.log1p(1095) * 0.55, 0.65, 1.2);
    const breadth = clamp(0.9 + Math.log2(Math.max(1, protocol.chains.length)) * 0.045, 0.9, 1.15);
    const category = groupFactor(protocol.category);
    // Implied value = 8% of TVL × 7d growth × token-less tenure × chain breadth
    // × category-only launch plausibility. This keeps the complete snapshot
    // input-driven and moves implausible pre-token farm categories down in rank.
    const value = Math.max(1, Math.round(base * growth * tenure * breadth * category));
    const confidence = (protocol.change_7d == null ? 0 : 1)
      + (protocol.listed_at == null ? 0 : 1)
      + (protocol.chains.length ? 1 : 0);
    const factors = {
      base_tvl_usd: Math.round(base),
      growth_multiplier: Number(growth.toFixed(4)),
      tenure_days: Math.round(days),
      tenure_multiplier: Number(tenure.toFixed(4)),
      chain_count: protocol.chains.length,
      chain_multiplier: Number(breadth.toFixed(4)),
      category_multiplier: category
    };

    return {
      ...protocol,
      pre_token: true,
      on_watchlist: watch.has(protocol.slug),
      age_days: Math.round(days),
      implied_value_usd: value,
      confidence: confidence === 3
        ? 'Higher · all model inputs present'
        : confidence === 2
          ? 'Moderate · one input missing'
          : 'Lower · sparse history',
      factors,
      farm_steps: plan(protocol, Math.round(days))
    };
  });

  records.sort((left, right) =>
    right.implied_value_usd - left.implied_value_usd || left.slug.localeCompare(right.slug));
  return records.map((record, index) => ({ ...record, rank: index + 1 }));
}
