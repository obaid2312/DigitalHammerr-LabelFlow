import { google } from 'googleapis';
import { adminDb } from '../lib/firebaseAdmin';
import { decrypt, encrypt } from '../lib/crypto';
import { GmailLabel, EmailMetadata, OAuthTokens } from '../types';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;

/**
 * Creates a Google OAuth2 client and loads credentials.
 */
export async function getOAuthClient(uid: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured in environment.');
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Fetch refresh token from Firestore
  const tokenDoc = await adminDb.collection('oauth_tokens').doc(uid).get();
  if (!tokenDoc.exists) {
    throw new Error(`No OAuth tokens found for user ${uid}`);
  }

  const tokenData = tokenDoc.data() as OAuthTokens;
  const decryptedRefreshToken = decrypt(tokenData.refreshToken);

  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: decryptedRefreshToken,
    expiry_date: tokenData.expiry,
  });

  // Automatically update Firestore if the client refreshes the access token
  oauth2Client.on('tokens', async (tokens) => {
    const updateData: Partial<OAuthTokens> = {};
    if (tokens.access_token) {
      updateData.accessToken = tokens.access_token;
    }
    if (tokens.expiry_date) {
      updateData.expiry = tokens.expiry_date;
    }
    if (tokens.refresh_token) {
      updateData.refreshToken = encrypt(tokens.refresh_token);
    }
    
    if (Object.keys(updateData).length > 0) {
      await adminDb.collection('oauth_tokens').doc(uid).update(updateData);
      console.log(`Updated refreshed Gmail OAuth tokens in Firestore for ${uid}`);
    }
  });

  return oauth2Client;
}

/**
 * Fetches Gmail labels list.
 */
export async function fetchGmailLabels(uid: string): Promise<GmailLabel[]> {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.labels.list({ userId: 'me' });
  const labels = response.data.labels || [];

  const batch = adminDb.batch();
  const resultLabels: GmailLabel[] = [];

  for (const label of labels) {
    if (!label.id || !label.name) continue;

    const type = label.type === 'system' ? 'system' : 'user';
    const labelData: GmailLabel = {
      uid,
      labelId: label.id,
      labelName: label.name,
      type,
      messageCount: 0, // Gmail list endpoint doesn't return count directly, we can fetch details later or default
      isActive: false, // Default to inactive until selected
    };

    // Keep existing config if it exists
    const labelRef = adminDb.collection('gmail_labels').doc(`${uid}_${label.id}`);
    const existingDoc = await labelRef.get();
    
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      labelData.isActive = existingData?.isActive ?? false;
      labelData.messageCount = existingData?.messageCount ?? 0;
    }

    batch.set(labelRef, labelData, { merge: true });
    resultLabels.push(labelData);
  }

  await batch.commit();
  return resultLabels;
}

/**
 * Traverses email parts recursively to find message body content.
 */
function getEmailBody(payload: any): { body: string; hasAttachments: boolean } {
  let body = '';
  let hasAttachments = false;

  if (!payload) return { body, hasAttachments };

  // Detect attachments
  if (payload.body?.attachmentId || (payload.filename && payload.filename.length > 0)) {
    hasAttachments = true;
  }

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    body = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
  } else if (payload.mimeType === 'text/plain' && payload.body?.data) {
    body = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
  } else if (payload.parts) {
    for (const part of payload.parts) {
      const partResult = getEmailBody(part);
      if (partResult.hasAttachments) {
        hasAttachments = true;
      }
      // Prefer HTML body if available
      if (partResult.body) {
        if (part.mimeType === 'text/html') {
          body = partResult.body; // Overwrite or prioritize
        } else if (!body) {
          body = partResult.body;
        }
      }
    }
  }

  return { body, hasAttachments };
}

/**
 * Normalizes email response from Gmail API.
 */
export function normalizeGmailMessage(message: any, uid: string): EmailMetadata {
  const payload = message.payload;
  const headers = payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  const from = getHeader('from');
  const to = getHeader('to');
  const subject = getHeader('subject');
  const dateStr = getHeader('date');
  const timestamp = dateStr ? new Date(dateStr).getTime() : parseInt(message.internalDate);

  const { body, hasAttachments } = getEmailBody(payload);

  return {
    uid,
    messageId: message.id,
    threadId: message.threadId,
    from,
    to,
    subject: subject || '(No Subject)',
    snippet: message.snippet || '',
    body: body || message.snippet || '',
    labels: message.labelIds || [],
    timestamp: new Date(timestamp).toISOString(),
    createdAt: new Date().toISOString(),
    hasAttachments,
  };
}

/**
 * Fetches message metadata and stores in Firestore.
 */
export async function syncEmailById(uid: string, messageId: string): Promise<EmailMetadata> {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const email = normalizeGmailMessage(response.data, uid);
    
    // Check if email already exists in Firestore to preserve AI enrichments
    const emailRef = adminDb.collection('emails').doc(`${uid}_${messageId}`);
    const existingDoc = await emailRef.get();
    
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      // Merge AI fields back if they are missing from the Gmail payload
      if (existingData?.sentiment !== undefined) email.sentiment = existingData.sentiment;
      if (existingData?.aiSummary !== undefined) email.aiSummary = existingData.aiSummary;
      if (existingData?.leadScore !== undefined) email.leadScore = existingData.leadScore;
      if (existingData?.category !== undefined) email.category = existingData.category;
      if (existingData?.aiExtraction !== undefined) email.aiExtraction = existingData.aiExtraction;
    }

    await emailRef.set(email, { merge: true });
    return email;
  } catch (error) {
    console.error(`Error syncing message ${messageId} for user ${uid}:`, error);
    throw error;
  }
}

/**
 * Fetches and syncs emails for selected active labels.
 */
export async function syncActiveLabelEmails(uid: string, limit: number = 20) {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });

  // Get active labels
  const activeLabelsSnapshot = await adminDb
    .collection('gmail_labels')
    .where('uid', '==', uid)
    .where('isActive', '==', true)
    .get();

  if (activeLabelsSnapshot.empty) {
    return { syncedCount: 0, message: 'No active labels configured.' };
  }

  // Fetch list of recent messages containing any of the active label IDs
  // Query syntax in Gmail: "label:label_name OR category:category_name"
  const q = activeLabelsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      if (data.type === 'system') {
        if (data.labelId.startsWith('CATEGORY_')) {
          const categoryName = data.labelId.replace('CATEGORY_', '').toLowerCase();
          return `category:${categoryName}`;
        }
        return `label:${data.labelId}`;
      } else {
        return `label:"${data.labelName}"`;
      }
    })
    .join(' OR ');

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: limit,
  });

  const messages = listResponse.data.messages || [];
  let syncedCount = 0;

  for (const msg of messages) {
    if (!msg.id) continue;
    try {
      await syncEmailById(uid, msg.id);
      syncedCount++;
    } catch (e) {
      console.warn(`Failed to sync individual email ${msg.id}:`, e);
    }
  }

  // Update sync state
  await adminDb.collection('sync_state').doc(uid).set({
    uid,
    lastSync: new Date().toISOString(),
    historyId: listResponse.data.nextPageToken || '', // Store paging/history info
  }, { merge: true });

  return { syncedCount, totalFound: messages.length };
}

/**
 * Modifies labels on Gmail message.
 */
export async function modifyEmailLabels(
  uid: string,
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
): Promise<void> {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Update Gmail
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds,
      removeLabelIds,
    },
  });

  // 2. Sync changes to Firestore
  const emailRef = adminDb.collection('emails').doc(`${uid}_${messageId}`);
  const doc = await emailRef.get();
  if (doc.exists) {
    const data = doc.data() as EmailMetadata;
    const updatedLabels = [
      ...data.labels.filter((id) => !removeLabelIds.includes(id)),
      ...addLabelIds.filter((id) => !data.labels.includes(id)),
    ];
    await emailRef.update({ labels: updatedLabels });
  }
}

/**
 * Setup Gmail watch for Pub/Sub notifications.
 */
export async function watchGmail(uid: string): Promise<any> {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });

  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) {
    throw new Error('GMAIL_PUBSUB_TOPIC not configured in environment variables.');
  }

  // Active labels to filter watch
  const activeLabelsSnapshot = await adminDb
    .collection('gmail_labels')
    .where('uid', '==', uid)
    .where('isActive', '==', true)
    .get();

  const labelIds = activeLabelsSnapshot.docs.map((doc) => doc.data().labelId);

  const response = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
      labelFilterAction: labelIds.length > 0 ? 'include' : undefined,
    },
  });

  const { historyId, expiration } = response.data;

  await adminDb.collection('sync_state').doc(uid).set({
    uid,
    historyId,
    watchExpiration: expiration ? parseInt(expiration) : null,
    lastSync: new Date().toISOString(),
  }, { merge: true });

  return response.data;
}

/**
 * Stop Gmail watch.
 */
export async function stopWatchGmail(uid: string): Promise<void> {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });
  
  await gmail.users.stop({ userId: 'me' });
  
  await adminDb.collection('sync_state').doc(uid).update({
    watchExpiration: null,
  });
}

/**
 * Sends a reply to an email via Gmail API.
 */
export async function sendGmailReply(
  uid: string,
  emailId: string,
  replyBody: string
): Promise<any> {
  const auth = await getOAuthClient(uid);
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Fetch original email to get headers and thread ID
  const originalMsg = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full',
  });

  const headers = originalMsg.data.payload?.headers || [];
  const getHeader = (name: string): string => {
    const h = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value || '' : '';
  };

  const rfcMessageId = getHeader('message-id');
  const originalSubject = getHeader('subject') || '';
  const replySubject = originalSubject.toLowerCase().startsWith('re:') 
    ? originalSubject 
    : `Re: ${originalSubject}`;
  
  // Recipient of the reply should be the person who sent it (From)
  const replyTo = getHeader('from');
  if (!replyTo) {
    throw new Error('Could not identify sender to reply to.');
  }
  const threadId = originalMsg.data.threadId || undefined;

  // Convert text newlines to HTML br tags
  const htmlBody = replyBody.replace(/\n/g, '<br/>');

  // Convert HTML line breaks to MIME compliant headers/body
  const headersList = [
    `To: ${replyTo}`,
    `Subject: ${replySubject}`,
    rfcMessageId ? `In-Reply-To: ${rfcMessageId}` : '',
    rfcMessageId ? `References: ${rfcMessageId}` : '',
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
  ].filter(Boolean);

  const rawContent = headersList.join('\r\n') + '\r\n\r\n' + htmlBody;

  const encodedRaw = Buffer.from(rawContent)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedRaw,
      threadId,
    },
  });

  return response.data;
}
