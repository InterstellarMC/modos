export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type ItemKind = 'post' | 'comment';

export type ItemStatus = 'pending' | 'approved' | 'removed' | 'escalated';

export type Author = {
  username: string;
  accountAgeDays: number;
  karma: number;
  isNew: boolean;
  priorActions: number;
  trustScore: number;
};

export type AISignal = {
  label: string;
  weight: number;
  evidence: string;
};

export type RiskAssessment = {
  score: number;
  level: RiskLevel;
  primaryReason: string;
  signals: AISignal[];
  recommendedAction: 'approve' | 'remove' | 'escalate' | 'review';
  confidence: number;
  isLikelyFalsePositive: boolean;
};

export type QueueItem = {
  id: string;
  kind: ItemKind;
  subreddit: string;
  title: string | null;
  body: string;
  permalink: string;
  author: Author;
  reportCount: number;
  reportReasons: string[];
  createdAt: number;
  status: ItemStatus;
  risk: RiskAssessment;
  groupId: string | null;
};

export type RaidStatus = 'calm' | 'elevated' | 'critical';

export type RaidPoint = {
  t: number;
  posts: number;
  comments: number;
  reports: number;
  toxicity: number;
};

export type RaidEvent = {
  id: string;
  ts: number;
  kind: 'spike' | 'coordination' | 'toxicity' | 'newaccount' | 'mod' | 'system';
  message: string;
  severity: RiskLevel;
};

export type RaidIncident = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  status: RaidStatus;
  trigger: string;
  affectedUsers: number;
  events: RaidEvent[];
  series: RaidPoint[];
};

export type ModRule = {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
  matched: number;
  createdAt: number;
  author: string;
  preview: string[];
};

export type MemoryNote = {
  id: string;
  username: string;
  body: string;
  pinned: boolean;
  author: string;
  createdAt: number;
  tags: string[];
};

export type UserProfile = {
  username: string;
  accountAgeDays: number;
  karma: number;
  removalRate: number;
  warningCount: number;
  banCount: number;
  lastSeen: number;
  notes: MemoryNote[];
  toxicityTrend: number[];
};

export type RemovalDraft = {
  itemId: string;
  reasonCode: string;
  publicReply: string;
  modlogNote: string;
  tone: 'firm' | 'friendly' | 'neutral';
};

export type SubredditMeta = {
  name: string;
  subscribers: number;
  online: number;
  modCount: number;
  installedAt: number;
};

export type Overview = {
  subreddit: SubredditMeta;
  pending: number;
  resolvedToday: number;
  timeSavedMinutes: number;
  raid: {
    status: RaidStatus;
    confidence: number;
    summary: string;
  };
  topSignals: { label: string; count: number }[];
  queueByLevel: Record<RiskLevel, number>;
  weeklyVolume: { day: string; total: number; removed: number }[];
};

export type InitResponse = {
  type: 'init';
  postId: string | null;
  username: string;
  subreddit: string;
  overview: Overview;
  queue: QueueItem[];
  incident: RaidIncident;
  rules: ModRule[];
  notes: MemoryNote[];
  profiles: UserProfile[];
};

export type ActionResponse = {
  ok: boolean;
  message?: string;
};

export type DraftResponse = {
  draft: RemovalDraft;
};

export type RuleCompileResponse = {
  rule: ModRule;
  matches: { itemId: string; reason: string }[];
};
