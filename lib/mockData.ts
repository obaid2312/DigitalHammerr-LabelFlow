import { EmailMetadata, GmailLabel } from '@/types';

// In-memory store for mock label status
export let MOCK_LABELS: GmailLabel[] = [
  { uid: 'mock-user-123', labelId: 'INBOX', labelName: 'INBOX', type: 'system', messageCount: 420, isActive: false },
  { uid: 'mock-user-123', labelId: 'SENT', labelName: 'SENT', type: 'system', messageCount: 154, isActive: false },
  { uid: 'mock-user-123', labelId: 'Label_1', labelName: 'Customer Leads', type: 'user', messageCount: 18, isActive: true },
  { uid: 'mock-user-123', labelId: 'Label_2', labelName: 'Support Tickets', type: 'user', messageCount: 22, isActive: true },
  { uid: 'mock-user-123', labelId: 'Label_3', labelName: 'Partnership Requests', type: 'user', messageCount: 5, isActive: true },
  { uid: 'mock-user-123', labelId: 'Label_4', labelName: 'Finance & Invoices', type: 'user', messageCount: 12, isActive: false },
];

export let MOCK_EMAILS: EmailMetadata[] = [
  {
    uid: 'mock-user-123',
    messageId: 'msg_001',
    threadId: 'thread_001',
    from: 'John Miller <john.miller@acme-corp.com>',
    to: 'developer@example.com',
    subject: 'Enterprise Subscription & API Quote Request',
    snippet: 'Hi there, we are looking to move 120 users to your Enterprise tier. Can we hop on a call this Wednesday to discuss API limits and custom SLAs?',
    body: `Hi team,
    
I am the VP of Engineering at Acme Corp. We are evaluating LabelFlow for our support categorization pipeline. 

We expect to process around 50,000 emails per month across 120 agent seats. We would need:
1. Custom SLA response times.
2. Dedicated API endpoints with higher rate limits.
3. Single Sign-On (SSO) integration.

Could you please send over pricing details and let us know if you are free for a 15-minute call this Wednesday at 2 PM EST?

Best,
John Miller
VP Engineering, Acme Corp`,
    labels: ['Label_1', 'INBOX'],
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    createdAt: new Date().toISOString(),
    hasAttachments: false,
    sentiment: 'positive',
    category: 'Leads',
    leadScore: 92,
    aiSummary: 'John from Acme Corp requests pricing and custom SLA terms for 120 Enterprise seats. Requests a call on Wednesday at 2 PM EST.',
    aiExtraction: {
      company: 'Acme Corp',
      contactName: 'John Miller',
      intent: 'Enterprise software evaluation and custom contract negotiation.',
      urgency: 'high',
      actionItems: [
        'Send Enterprise pricing package sheet',
        'Check calendar availability for Wednesday at 2 PM EST',
        'Prepare SLA documentation template'
      ],
      keyEntities: ['Acme Corp', '120 users', '50,000 emails', 'SSO', 'API limits']
    }
  },
  {
    uid: 'mock-user-123',
    messageId: 'msg_002',
    threadId: 'thread_002',
    from: 'Alice Smith <alice@startuphub.io>',
    to: 'developer@example.com',
    subject: 'Urgent: Login page is throwing 500 Internal Server Errors',
    snippet: 'Since 10 minutes ago, our users are getting a blank screen and 500 errors when attempting to sign in. Please check immediately!',
    body: `Hello Support,
    
We are experiencing a major outage with our dashboard login. None of our staff can log in, and our client users are complaining about 500 error screens.

This is a critical block for our operation. Can someone look into this immediately? Our organization ID is startup-hub-99.

Thanks,
Alice Smith
Operations Manager`,
    labels: ['Label_2', 'INBOX'],
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date().toISOString(),
    hasAttachments: true,
    sentiment: 'negative',
    category: 'Support',
    leadScore: 15,
    aiSummary: 'Alice reports a critical block where startuphub.io users are encountering 500 errors on the login page. Operations are halted.',
    aiExtraction: {
      company: 'StartupHub',
      contactName: 'Alice Smith',
      intent: 'Critical platform outage bug report.',
      urgency: 'urgent',
      actionItems: [
        'Verify dashboard auth service health logs',
        'Respond to user with status link and acknowledgement',
        'Assign engineer to investigate 조직 ID startup-hub-99'
      ],
      keyEntities: ['StartupHub', '500 error', 'outage', 'startup-hub-99']
    }
  },
  {
    uid: 'mock-user-123',
    messageId: 'msg_003',
    threadId: 'thread_003',
    from: 'Michael Chen <m.chen@ventures.vc>',
    to: 'developer@example.com',
    subject: 'LabelFlow Seed Round & Partnership Opportunities',
    snippet: 'Loved the Product Hunt launch. We are a seed-stage SaaS fund focusing on AI productivity utilities. Would love to connect with the founders.',
    body: `Hi there,
    
I saw your recent launch on Product Hunt and was thoroughly impressed by your growth numbers and API response speeds.

Our VC fund, Ventures Capital, is actively investing in AI-orchestrated workflow platforms. We typically write checks between $500k to $1.5M.

Are you raising a seed round? If so, I would love to schedule a brief meeting to learn more about your roadmap.

Best,
Michael Chen
Investment Partner, Ventures Capital`,
    labels: ['Label_3', 'INBOX'],
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
    createdAt: new Date().toISOString(),
    hasAttachments: false,
    sentiment: 'positive',
    category: 'Work',
    leadScore: 78,
    aiSummary: 'Michael from Ventures Capital expresses interest in a potential Seed round investment of $500k-$1.5M following LabelFlow launch.',
    aiExtraction: {
      company: 'Ventures Capital',
      contactName: 'Michael Chen',
      intent: 'Venture capital investment inquiry.',
      urgency: 'medium',
      actionItems: [
        'Reply to investor regarding current funding status',
        'Prepare investor deck copy'
      ],
      keyEntities: ['Ventures Capital', 'Product Hunt', 'Seed round', '$500k-$1.5M']
    }
  },
  {
    uid: 'mock-user-123',
    messageId: 'msg_004',
    threadId: 'thread_004',
    from: 'CloudBilling Billing Team <no-reply@cloudbilling.com>',
    to: 'developer@example.com',
    subject: 'Monthly Cloud Infrastructure Invoice: May 2026',
    snippet: 'Your monthly bill for $420.50 has been processed successfully. You can download the PDF invoice inside your account.',
    body: `Dear Customer,
    
Your monthly invoice for Cloud Services used in May 2026 is now available.
Amount Charged: $420.50 USD
Charged to Card ending in *4242.

No action is required. This email serves as receipt.

Thanks,
CloudBilling Support`,
    labels: ['Label_4'],
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    createdAt: new Date().toISOString(),
    hasAttachments: true,
    sentiment: 'neutral',
    category: 'Finance',
    leadScore: 10,
    aiSummary: 'Invoice confirmation email from CloudBilling for $420.50 processed on card ending in *4242.',
    aiExtraction: {
      company: 'CloudBilling',
      contactName: 'Billing Team',
      intent: 'Automatic billing receipt confirmation.',
      urgency: 'low',
      actionItems: [
        'File receipt under operating expenses'
      ],
      keyEntities: ['$420.50', 'May 2026', '*4242']
    }
  },
  {
    uid: 'mock-user-123',
    messageId: 'msg_005',
    threadId: 'thread_005',
    from: 'David Ko <david@saasscale.com>',
    to: 'developer@example.com',
    subject: 'Potential Integration Partnership: SaaSScale Analytics',
    snippet: 'Hi, we run SaaSScale, a platform helping founders track trial conversions. We have a lot of overlap in client base. Ideas on integrating?',
    body: `Hi,

Hope you are doing well!

I noticed LabelFlow tracks customer leads from emails. Our platform, SaaSScale, tracks what those leads do after they sign up. An integration where LabelFlow feeds opportunity scores into SaaSScale trial dashboards would be incredibly high-value for our shared users.

Would you be open to collaborating on a native integration? We can co-market it to our 2,000+ active SaaS teams.

Let me know if you want to chat next week.

Cheers,
David Ko
Founder, SaaSScale`,
    labels: ['Label_3', 'INBOX'],
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2 days ago
    createdAt: new Date().toISOString(),
    hasAttachments: false,
    sentiment: 'positive',
    category: 'Work',
    leadScore: 70,
    aiSummary: 'David proposes a integration partnership between LabelFlow and SaaSScale to sync lead scores with conversion tracking.',
    aiExtraction: {
      company: 'SaaSScale',
      contactName: 'David Ko',
      intent: 'Software integration and co-marketing partnership proposal.',
      urgency: 'medium',
      actionItems: [
        'Evaluate integration complexity with conversion API',
        'Schedule a zoom chat for next week'
      ],
      keyEntities: ['SaaSScale', 'integration', 'co-market', '2,000+ active SaaS teams']
    }
  },
  {
    uid: 'mock-user-123',
    messageId: 'msg_006',
    threadId: 'thread_006',
    from: 'Marketing Weekly <newsletter@marketingweekly.net>',
    to: 'developer@example.com',
    subject: '10 Growth Hacks to Double Your SaaS Traffic in 30 Days',
    snippet: 'In this newsletter, we break down real-world growth campaigns from Slack, Notion, and Vercel. Learn how to write SEO articles that convert.',
    body: `Hey Growth Hacker,
    
Welcome to our weekly dispatch of SaaS strategies. Today we cover:
- How Slack leveraged dynamic directories.
- Notion's template ecosystem.
- The precise conversion rates of top landing pages.

Join our premium group for $9/mo to get full spreadsheets.

Best,
Marketing Weekly`,
    labels: ['INBOX'],
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), // 3 days ago
    createdAt: new Date().toISOString(),
    hasAttachments: false,
    sentiment: 'neutral',
    category: 'Marketing',
    leadScore: 5,
    aiSummary: 'Growth marketing newsletter breaking down strategies used by Slack, Notion, and Vercel.',
    aiExtraction: {
      company: 'Marketing Weekly',
      contactName: 'Newsletter Writer',
      intent: 'Marketing content distribution.',
      urgency: 'low',
      actionItems: [],
      keyEntities: ['Slack', 'Notion', 'Vercel', 'SEO']
    }
  }
];

export function getMockEmails(query?: string, labelId?: string, category?: string, sentiment?: string) {
  let list = [...MOCK_EMAILS];
  
  if (labelId) {
    list = list.filter(e => e.labels.includes(labelId));
  }
  if (category) {
    list = list.filter(e => e.category === category);
  }
  if (sentiment) {
    list = list.filter(e => e.sentiment === sentiment);
  }
  
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(e => 
      e.subject.toLowerCase().includes(q) ||
      e.from.toLowerCase().includes(q) ||
      e.snippet.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q)
    );
  }
  
  return list;
}

export function getMockEmailDetail(emailId: string) {
  return MOCK_EMAILS.find(e => e.messageId === emailId) || null;
}

export function updateMockEmailLabels(emailId: string, labelsList: string[]) {
  const email = MOCK_EMAILS.find(e => e.messageId === emailId);
  if (email) {
    email.labels = labelsList;
  }
  return email;
}

export function toggleMockLabel(labelId: string, isActive: boolean) {
  const label = MOCK_LABELS.find(l => l.labelId === labelId);
  if (label) {
    label.isActive = isActive;
  }
  return label;
}

export function addMockEmail(email: EmailMetadata) {
  MOCK_EMAILS.unshift(email);
  return email;
}
