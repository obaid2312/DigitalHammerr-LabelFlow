export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface OAuthTokens {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiry: number; // Timestamp in ms
  scopes: string[];
}

export interface GmailLabel {
  uid: string;
  labelId: string;
  labelName: string;
  type: 'system' | 'user';
  messageCount: number;
  isActive: boolean; // Custom field to track if user has selected it for sync
}

export interface EmailMetadata {
  uid: string;
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  labels: string[]; // Gmail Label IDs
  timestamp: string; // ISO String or ms timestamp
  createdAt: string;
  
  // AI Insights
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiSummary?: string;
  leadScore?: number; // 0 to 100
  category?: 'Leads' | 'Finance' | 'Personal' | 'Work' | 'Support' | 'Marketing' | 'Spam-like';
  
  // Detailed AI extraction
  aiExtraction?: {
    company?: string;
    contactName?: string;
    intent?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    actionItems?: string[];
    keyEntities?: string[];
  };
  
  hasAttachments?: boolean;
}

export interface SyncState {
  uid: string;
  historyId?: string;
  watchExpiration?: number; // Timestamp
  lastSync?: string; // ISO String
}

export interface DashboardStats {
  totalEmails: number;
  totalLeads: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryDistribution: Record<string, number>;
  labelActivity: { name: string; count: number }[];
  emailTrend: { date: string; count: number }[];
  recentLeads: EmailMetadata[];
}
