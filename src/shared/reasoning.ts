import type {
  AISignal,
  Author,
  QueueItem,
  RemovalDraft,
  RiskAssessment,
  RiskLevel,
} from './types';

const TOXIC_PATTERNS: { rx: RegExp; weight: number; label: string }[] = [
  { rx: /\b(kys|kill\s*yourself)\b/i, weight: 0.95, label: 'Self-harm directive' },
  { rx: /\b(retard(ed)?|sl[uo]r)\b/i, weight: 0.85, label: 'Slur or harassment' },
  { rx: /\b(idiot|moron|stupid|dumb(ass)?)\b/i, weight: 0.35, label: 'Personal insult' },
  { rx: /\b(shut\s*up|f\*ck\s*off|stfu)\b/i, weight: 0.45, label: 'Hostile tone' },
  { rx: /\b(scam|scammer|fraud|fake)\b/i, weight: 0.4, label: 'Accusation language' },
  { rx: /\bbrigade|raid this|let's go to\b/i, weight: 0.7, label: 'Brigade signal' },
  { rx: /\b(rape|murder|attack)\b/i, weight: 0.6, label: 'Violent language' },
];

const SPAM_PATTERNS: { rx: RegExp; weight: number; label: string }[] = [
  { rx: /https?:\/\/\S+/gi, weight: 0.2, label: 'Outbound link' },
  { rx: /\b(buy now|free trial|earn \$\d+|click here)\b/i, weight: 0.55, label: 'Promotional CTA' },
  { rx: /(👉|💰|🔥){2,}/, weight: 0.25, label: 'Promotional emoji cluster' },
  { rx: /\bdm me\b/i, weight: 0.3, label: 'DM solicitation' },
  { rx: /\b(crypto|nft|airdrop|bitcoin)\b/i, weight: 0.15, label: 'Crypto solicitation keyword' },
];

const QUALITY_BONUS: { rx: RegExp; weight: number; label: string }[] = [
  { rx: /\b(thanks|thank you|appreciate|happy to)\b/i, weight: -0.15, label: 'Constructive tone' },
  { rx: /\?$/m, weight: -0.05, label: 'Genuine question' },
];

const REPEAT_RX = /(.)\1{4,}/;
const ALLCAPS_RX = /\b[A-Z]{6,}\b/;

const round = (n: number, places = 2) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

const levelFor = (score: number): RiskLevel => {
  if (score >= 0.8) return 'critical';
  if (score >= 0.55) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
};

const authorSignals = (author: Author): AISignal[] => {
  const signals: AISignal[] = [];
  if (author.accountAgeDays < 7) {
    signals.push({
      label: 'New account',
      weight: 0.25,
      evidence: `Account created ${author.accountAgeDays} day${author.accountAgeDays === 1 ? '' : 's'} ago`,
    });
  }
  if (author.karma < 0) {
    signals.push({
      label: 'Negative karma',
      weight: 0.2,
      evidence: `Karma is ${author.karma}`,
    });
  } else if (author.karma < 20 && author.accountAgeDays < 30) {
    signals.push({
      label: 'Low engagement history',
      weight: 0.1,
      evidence: `${author.karma} karma in ${author.accountAgeDays}d`,
    });
  }
  if (author.priorActions >= 2) {
    signals.push({
      label: 'Prior mod actions',
      weight: Math.min(0.35, 0.12 * author.priorActions),
      evidence: `${author.priorActions} prior removals/warnings`,
    });
  }
  if (author.trustScore > 80) {
    signals.push({
      label: 'Trusted contributor',
      weight: -0.25,
      evidence: `Trust ${author.trustScore}/100 from prior conduct`,
    });
  }
  return signals;
};

const contentSignals = (text: string, reportReasons: string[]): AISignal[] => {
  const signals: AISignal[] = [];
  for (const p of TOXIC_PATTERNS) {
    if (p.rx.test(text)) {
      signals.push({
        label: p.label,
        weight: p.weight,
        evidence: `Phrase matched in body`,
      });
    }
  }
  for (const p of SPAM_PATTERNS) {
    const matches = text.match(p.rx);
    if (matches) {
      const hits = matches.length;
      signals.push({
        label: p.label,
        weight: Math.min(0.7, p.weight * Math.min(3, hits)),
        evidence: `${hits} match${hits > 1 ? 'es' : ''} in body`,
      });
    }
  }
  for (const p of QUALITY_BONUS) {
    if (p.rx.test(text)) {
      signals.push({
        label: p.label,
        weight: p.weight,
        evidence: 'Detected in body',
      });
    }
  }
  if (REPEAT_RX.test(text)) {
    signals.push({
      label: 'Spam-like repetition',
      weight: 0.2,
      evidence: 'Long character repetition detected',
    });
  }
  if (ALLCAPS_RX.test(text)) {
    signals.push({
      label: 'Shouting (ALL CAPS)',
      weight: 0.1,
      evidence: 'Word in all caps detected',
    });
  }
  if (reportReasons.length) {
    const dedup = new Set(reportReasons);
    signals.push({
      label: `${reportReasons.length} user report${reportReasons.length === 1 ? '' : 's'}`,
      weight: Math.min(0.35, 0.08 * reportReasons.length),
      evidence: Array.from(dedup).slice(0, 3).join(' · '),
    });
  }
  return signals;
};

export const assessItem = (
  body: string,
  author: Author,
  reportReasons: string[]
): RiskAssessment => {
  const text = body ?? '';
  const signals = [...authorSignals(author), ...contentSignals(text, reportReasons)];

  let score = 0;
  for (const s of signals) score += s.weight;
  score = clamp(score);

  const positive = signals.filter((s) => s.weight > 0).sort((a, b) => b.weight - a.weight);
  const primary = positive[0];
  const primaryReason = primary?.label ?? 'No risk signals detected';

  let recommended: RiskAssessment['recommendedAction'];
  if (score >= 0.8) recommended = 'remove';
  else if (score >= 0.55) recommended = 'escalate';
  else if (score >= 0.3) recommended = 'review';
  else recommended = 'approve';

  const trustOffset = clamp((author.trustScore - 50) / 100, -0.5, 0.5);
  const fpScore = clamp(0.4 - score + trustOffset);
  const isLikelyFalsePositive =
    reportReasons.length > 0 && score < 0.4 && author.trustScore > 65;

  const confidence = clamp(0.6 + Math.abs(score - 0.5) * 0.7 + (signals.length > 4 ? 0.1 : 0));

  return {
    score: round(score),
    level: levelFor(score),
    primaryReason,
    signals: signals.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    recommendedAction: recommended,
    confidence: round(confidence),
    isLikelyFalsePositive: isLikelyFalsePositive || fpScore > 0.4,
  };
};

const tonePrefix: Record<RemovalDraft['tone'], string> = {
  firm: 'Removed.',
  friendly: 'Hey there — thanks for posting.',
  neutral: 'Hi,',
};

export const draftRemoval = (
  item: QueueItem,
  tone: RemovalDraft['tone'] = 'neutral'
): RemovalDraft => {
  const sub = item.subreddit.replace(/^r\//, '');
  const top = item.risk.signals.find((s) => s.weight > 0);
  const reason = top?.label ?? item.risk.primaryReason;
  const code = top
    ? top.label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')
    : 'rule-violation';

  const evidenceLine = top
    ? `Specifically: ${top.evidence.toLowerCase()}.`
    : 'Specifically: the content does not meet community standards.';

  const closing =
    tone === 'firm'
      ? 'Repeated violations may result in a temporary ban. You can appeal via modmail.'
      : tone === 'friendly'
        ? 'You are welcome to revise and try again. If you think this was a mistake, reply via modmail and a human mod will review.'
        : 'If you believe this was a mistake, please reply via modmail and a moderator will review.';

  const publicReply =
    `${tonePrefix[tone]} Your ${item.kind} in r/${sub} was removed because it appears to violate our community guidelines (${reason}). ${evidenceLine} ${closing}`.trim();

  const modlogNote = `MODOS · ${reason} · score ${item.risk.score.toFixed(2)} · confidence ${(
    item.risk.confidence * 100
  ).toFixed(0)}%`;

  return {
    itemId: item.id,
    reasonCode: code,
    publicReply,
    modlogNote,
    tone,
  };
};

const ruleKeywords = (prompt: string) => {
  const out: string[] = [];
  for (const m of prompt.toLowerCase().matchAll(/[a-z]{4,}/g)) out.push(m[0]);
  return Array.from(new Set(out));
};

const STOPWORDS = new Set([
  'with',
  'from',
  'that',
  'this',
  'have',
  'about',
  'into',
  'flag',
  'when',
  'auto',
  'review',
  'high',
  'their',
  'them',
  'they',
  'over',
  'item',
  'items',
  'posts',
  'comments',
  'post',
  'comment',
  'user',
  'users',
  'just',
  'like',
  'will',
  'should',
  'would',
  'prior',
  'recent',
  'highly',
  'mark',
  'detect',
  'likely',
  'priority',
  'queue',
]);

export const matchRule = (
  prompt: string,
  items: QueueItem[]
): { itemId: string; reason: string }[] => {
  const lower = prompt.toLowerCase();
  const want = {
    newAccount: /new account|newly created|fresh account|low karma/.test(lower),
    toxic: /toxic|harass|hate|insult|slur|hostile/.test(lower),
    spam: /spam|self.?promo|link|promotion|crypto|nft|advert/.test(lower),
    ban: /ban evasion|evade|alt account/.test(lower),
    political: /political|politic/.test(lower),
    repeat: /repeat|repeated|consistent|prior/.test(lower),
  };
  const keywords = ruleKeywords(prompt).filter(
    (k) => !STOPWORDS.has(k) && !/^(new|toxic|spam|hate|insult|crypto|nft|link)$/.test(k)
  );
  const matches: { itemId: string; reason: string }[] = [];
  for (const it of items) {
    let hits = 0;
    const reasons: string[] = [];
    if (want.newAccount && it.author.accountAgeDays < 14) {
      hits += 1;
      reasons.push(`new account (${it.author.accountAgeDays}d)`);
    }
    if (want.toxic && it.risk.signals.some((s) => /toxic|slur|insult|hostile|harass/i.test(s.label))) {
      hits += 1;
      reasons.push('toxic language');
    }
    if (want.spam && it.risk.signals.some((s) => /promot|link|crypto|spam|emoji/i.test(s.label))) {
      hits += 1;
      reasons.push('promotional signal');
    }
    if (want.ban && it.author.accountAgeDays < 30 && it.author.priorActions >= 1) {
      hits += 1;
      reasons.push('possible ban-evasion pattern');
    }
    if (want.repeat && it.author.priorActions >= 2) {
      hits += 1;
      reasons.push(`${it.author.priorActions} prior actions`);
    }
    const body = (it.body + ' ' + (it.title ?? '')).toLowerCase();
    const kwHits = keywords.filter((k) => body.includes(k));
    if (kwHits.length) {
      hits += kwHits.length * 0.5;
      reasons.push(`keyword: ${kwHits.slice(0, 2).join(', ')}`);
    }
    if (hits >= 1) {
      matches.push({ itemId: it.id, reason: reasons.join(' · ') });
    }
  }
  return matches.sort((a, b) => b.reason.length - a.reason.length);
};
