import { assessItem } from './reasoning';
import type {
  Author,
  MemoryNote,
  ModRule,
  Overview,
  QueueItem,
  RaidIncident,
  UserProfile,
} from './types';

const mulberry32 = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T,>(rng: () => number, arr: readonly T[]): T => {
  const idx = Math.floor(rng() * arr.length);
  return arr[idx] as T;
};

const NAMES = [
  'midnight_owl42',
  'pixelpilgrim',
  'snowblind__',
  'taco_tuesday',
  'orbital_ronin',
  'sleepy_panda9',
  'definitely_real_human',
  'crypto_chad_42',
  'free_trial_now',
  'newaccount_2026',
  'gentle_giant',
  'mod_mentor',
  'community_friend',
  'baked_potato',
  'serverless_sam',
  'lurker_4_life',
  'rage_qu1t',
  'just_asking_q',
  'definitely_not_alt',
  'verified_skeptic',
];

const SPAM_BODIES = [
  '🔥🔥 FREE TRIAL — earn $5000/week with this one weird crypto trick. DM me!! https://promo.example/x',
  'CHECK OUT MY NEW NFT DROP 👉👉 click here https://nft.example/launch buy now before sold out',
  'I have an airdrop spot for you, dm me your wallet, it is totally legit trust me bro https://airdrop.example',
  'Make $300/day from home — no skills required, click here 💰💰💰 https://easy.example',
];

const TOXIC_BODIES = [
  "kys you idiot, nobody here cares about your dumb opinion. shut up already and stop posting.",
  "what a moron, why are you even allowed on this sub. you literal sl*r, kill yourself already",
  "lol this guy is a scammer for sure, everyone report him. brigade incoming, let's go to their profile",
  'STFU you stupid little troll, take your political BS to another sub before I lose it.',
];

const NORMAL_BODIES = [
  "Has anyone else noticed the latest update changed how the queue behaves on mobile? Curious if it's just me.",
  "Quick PSA — the modmail bot is back online after maintenance. Thanks to everyone who patiently waited.",
  "I found a small bug in the rules sidebar on old reddit. Reproduces in Firefox 120. Sharing here for awareness.",
  "Reminder: rule 4 covers low-effort screenshots. We've started using AI assist to triage these — feedback welcome!",
  "Genuine question — what's the community policy on long-form essays? Happy to follow whichever way the mods prefer.",
];

const POLITICAL_BODIES = [
  'Why does every political post devolve into the same screaming match? Maybe we need stricter rules on election threads. People are exhausted.',
  'This party is full of corrupt morons who hate our values. Wake up sheeple. STFU and read a book before commenting.',
  'Genuine question: how do mods balance free speech with toxicity on political megathreads during election season?',
];

const SUBTLE_HARASSMENT = [
  "haha sure 'genius'. maybe finish 7th grade before quoting Hayek next time.",
  "definitely_not_alt is back again with the same talking points. weird, almost like coordinated.",
];

const TITLES = [
  'Update on the new flair system — feedback please',
  'Daily thread — share what you are working on',
  'Megathread: tournament discussion',
  null,
  null,
  'PSA: read the rules before posting',
  'A small bug report I noticed today',
  'Why is the mod team ignoring rule 4 violations?',
  null,
];

const REPORT_REASONS = [
  'Harassment',
  'Spam',
  'Misinformation',
  'Hate speech',
  'Off-topic',
  'Brigading',
  'Rule 4 violation',
  'Personal attack',
];

const newAuthor = (rng: () => number, idx: number): Author => {
  const age = Math.floor(rng() * 1200);
  const isNew = age < 14;
  const username = NAMES[(idx + Math.floor(rng() * NAMES.length)) % NAMES.length] ?? `user_${idx}`;
  const karma = isNew
    ? Math.floor(rng() * 50) - 10
    : Math.floor(rng() * 5000);
  const priorActions = isNew ? Math.floor(rng() * 4) : Math.floor(rng() * 2);
  const trustScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        50 + (age > 365 ? 25 : age > 90 ? 10 : -10) - priorActions * 8 + (karma > 1000 ? 10 : 0)
      )
    )
  );
  return {
    username,
    accountAgeDays: age,
    karma,
    isNew,
    priorActions,
    trustScore,
  };
};

export const buildSeed = (
  subreddit = 'r/example',
  seedNumber = 8675309
): {
  overview: Overview;
  queue: QueueItem[];
  incident: RaidIncident;
  rules: ModRule[];
  notes: MemoryNote[];
  profiles: UserProfile[];
} => {
  const rng = mulberry32(seedNumber);
  const now = Date.now();

  const buckets: { bodies: readonly string[]; weight: number }[] = [
    { bodies: SPAM_BODIES, weight: 0.18 },
    { bodies: TOXIC_BODIES, weight: 0.28 },
    { bodies: NORMAL_BODIES, weight: 0.3 },
    { bodies: POLITICAL_BODIES, weight: 0.14 },
    { bodies: SUBTLE_HARASSMENT, weight: 0.1 },
  ];
  const pickBody = () => {
    const r = rng();
    let acc = 0;
    for (const b of buckets) {
      acc += b.weight;
      if (r < acc) return pick(rng, b.bodies);
    }
    return pick(rng, NORMAL_BODIES);
  };

  const queue: QueueItem[] = [];
  for (let i = 0; i < 24; i++) {
    const body = pickBody();
    const reports: string[] = [];
    const numReports = Math.floor(rng() * 5);
    for (let r = 0; r < numReports; r++) {
      reports.push(pick(rng, REPORT_REASONS));
    }
    const author = newAuthor(rng, i);
    const risk = assessItem(body, author, reports);
    queue.push({
      id: `q_${i}_${seedNumber}`,
      kind: rng() > 0.55 ? 'post' : 'comment',
      subreddit,
      title: pick(rng, TITLES),
      body,
      permalink: `https://reddit.com/${subreddit}/comments/${(seedNumber + i).toString(36)}`,
      author,
      reportCount: numReports,
      reportReasons: reports,
      createdAt: now - Math.floor(rng() * 1000 * 60 * 60 * 6),
      status: 'pending',
      risk,
      groupId: null,
    });
  }

  for (const item of queue) {
    const sameAuthorOthers = queue.filter(
      (q) => q.author.username === item.author.username && q.id !== item.id
    );
    if (sameAuthorOthers.length >= 1 && item.risk.score >= 0.4) {
      item.groupId = `g_${item.author.username}`;
    }
  }

  queue.sort((a, b) => b.risk.score - a.risk.score);

  const series: RaidIncident['series'] = [];
  for (let t = -28; t <= 0; t++) {
    const baseline = 4 + Math.sin(t / 4) * 2;
    const spike =
      t >= -10 && t <= -2
        ? Math.max(0, (10 - Math.abs(t + 6)) * (3.5 + rng() * 1.5))
        : 0;
    series.push({
      t: now + t * 60 * 1000,
      posts: Math.max(0, Math.round(baseline + spike * 0.6 + rng() * 1.5)),
      comments: Math.max(0, Math.round(baseline * 2.2 + spike + rng() * 2)),
      reports: Math.max(0, Math.round(baseline * 0.4 + spike * 0.8 + rng())),
      toxicity:
        Math.round(
          Math.min(
            1,
            Math.max(
              0,
              0.18 + (t >= -10 && t <= -2 ? 0.35 + rng() * 0.15 : rng() * 0.08)
            )
          ) * 100
        ) / 100,
    });
  }

  const events: RaidIncident['events'] = [
    {
      id: 'e1',
      ts: now - 9 * 60 * 1000,
      kind: 'spike',
      message: 'Comment volume +480% above baseline within 90s.',
      severity: 'high',
    },
    {
      id: 'e2',
      ts: now - 8 * 60 * 1000,
      kind: 'newaccount',
      message: '7 reports from accounts <2d old targeting one user.',
      severity: 'critical',
    },
    {
      id: 'e3',
      ts: now - 6 * 60 * 1000,
      kind: 'coordination',
      message: 'Inbound referrer from external subreddit detected.',
      severity: 'high',
    },
    {
      id: 'e4',
      ts: now - 4 * 60 * 1000,
      kind: 'toxicity',
      message: 'Toxicity index 0.71 (sustained for 3 minutes).',
      severity: 'high',
    },
    {
      id: 'e5',
      ts: now - 2 * 60 * 1000,
      kind: 'mod',
      message: 'MODOS auto-throttled new-account posts (suggested).',
      severity: 'medium',
    },
  ];

  const incident: RaidIncident = {
    id: 'incident_now',
    startedAt: now - 10 * 60 * 1000,
    endedAt: null,
    status: 'critical',
    trigger: 'Coordinated influx from r/example_brigade',
    affectedUsers: 142,
    events,
    series,
  };

  const rules: ModRule[] = [
    {
      id: 'rule_1',
      name: 'Brigading from new accounts',
      prompt: 'Flag posts from accounts under 7 days old with toxic language or coordinated reports.',
      enabled: true,
      matched: 14,
      createdAt: now - 1000 * 60 * 60 * 24 * 3,
      author: 'mod_mentor',
      preview: ['new account · 3d · toxic language', 'new account · 1d · 4 reports'],
    },
    {
      id: 'rule_2',
      name: 'Crypto self-promo',
      prompt: 'Auto-review posts with airdrop / NFT / crypto promotion keywords.',
      enabled: true,
      matched: 7,
      createdAt: now - 1000 * 60 * 60 * 24 * 10,
      author: 'community_friend',
      preview: ['promotional CTA · crypto keyword', 'DM solicitation · emoji cluster'],
    },
    {
      id: 'rule_3',
      name: 'Escalate political toxicity',
      prompt: 'Highlight political posts with toxicity above 0.5 and at least 2 reports.',
      enabled: false,
      matched: 3,
      createdAt: now - 1000 * 60 * 60 * 24 * 21,
      author: 'mod_mentor',
      preview: ['political · 0.62 toxicity · 3 reports'],
    },
  ];

  const notes: MemoryNote[] = [
    {
      id: 'n1',
      username: 'rage_qu1t',
      body: 'Two prior 7d bans for harassing rule 4 threads. Patterns suggest brigading from external sub.',
      pinned: true,
      author: 'mod_mentor',
      createdAt: now - 1000 * 60 * 60 * 48,
      tags: ['brigading', 'rule-4'],
    },
    {
      id: 'n2',
      username: 'definitely_not_alt',
      body: 'Probable alt of u/rage_qu1t. Same writing tics, same external referrers. Watch for ban evasion.',
      pinned: true,
      author: 'community_friend',
      createdAt: now - 1000 * 60 * 60 * 26,
      tags: ['ban-evasion', 'alt'],
    },
    {
      id: 'n3',
      username: 'crypto_chad_42',
      body: 'Repeatedly drops shortened links to NFT drops. 3 warnings already. Next step is a temp ban.',
      pinned: false,
      author: 'mod_mentor',
      createdAt: now - 1000 * 60 * 60 * 12,
      tags: ['spam', 'self-promo'],
    },
    {
      id: 'n4',
      username: 'gentle_giant',
      body: 'Long-time contributor. Reports against them are usually retaliatory — review carefully before action.',
      pinned: false,
      author: 'community_friend',
      createdAt: now - 1000 * 60 * 60 * 60,
      tags: ['trusted'],
    },
  ];

  const profiles: UserProfile[] = [
    {
      username: 'rage_qu1t',
      accountAgeDays: 124,
      karma: 318,
      removalRate: 0.42,
      warningCount: 4,
      banCount: 2,
      lastSeen: now - 1000 * 60 * 8,
      notes: notes.filter((n) => n.username === 'rage_qu1t'),
      toxicityTrend: [0.1, 0.18, 0.22, 0.31, 0.4, 0.52, 0.7],
    },
    {
      username: 'definitely_not_alt',
      accountAgeDays: 6,
      karma: 18,
      removalRate: 0.6,
      warningCount: 1,
      banCount: 0,
      lastSeen: now - 1000 * 60 * 2,
      notes: notes.filter((n) => n.username === 'definitely_not_alt'),
      toxicityTrend: [0.4, 0.55, 0.6, 0.7, 0.78],
    },
    {
      username: 'crypto_chad_42',
      accountAgeDays: 32,
      karma: 410,
      removalRate: 0.55,
      warningCount: 3,
      banCount: 0,
      lastSeen: now - 1000 * 60 * 90,
      notes: notes.filter((n) => n.username === 'crypto_chad_42'),
      toxicityTrend: [0.2, 0.22, 0.25, 0.3, 0.28, 0.31],
    },
    {
      username: 'gentle_giant',
      accountAgeDays: 1620,
      karma: 41280,
      removalRate: 0.02,
      warningCount: 0,
      banCount: 0,
      lastSeen: now - 1000 * 60 * 30,
      notes: notes.filter((n) => n.username === 'gentle_giant'),
      toxicityTrend: [0.05, 0.04, 0.06, 0.05, 0.04],
    },
  ];

  const queueByLevel = queue.reduce(
    (acc, q) => {
      acc[q.risk.level] = (acc[q.risk.level] ?? 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  const overview: Overview = {
    subreddit: {
      name: subreddit,
      subscribers: 248_900,
      online: 1_823,
      modCount: 14,
      installedAt: now - 1000 * 60 * 60 * 24 * 12,
    },
    pending: queue.filter((q) => q.status === 'pending').length,
    resolvedToday: 312,
    timeSavedMinutes: 184,
    raid: {
      status: incident.status,
      confidence: 0.92,
      summary:
        'Coordinated brigade detected · 142 new-account inflows · toxicity index 0.71',
    },
    topSignals: [
      { label: 'New account', count: 11 },
      { label: 'Toxic language', count: 9 },
      { label: 'Promotional CTA', count: 5 },
      { label: 'User reports', count: 27 },
    ],
    queueByLevel,
    weeklyVolume: [
      { day: 'Mon', total: 412, removed: 38 },
      { day: 'Tue', total: 388, removed: 31 },
      { day: 'Wed', total: 502, removed: 52 },
      { day: 'Thu', total: 446, removed: 41 },
      { day: 'Fri', total: 612, removed: 78 },
      { day: 'Sat', total: 789, removed: 110 },
      { day: 'Sun', total: 1432, removed: 261 },
    ],
  };

  return { overview, queue, incident, rules, notes, profiles };
};
