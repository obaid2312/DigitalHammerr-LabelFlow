import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { syncActiveLabelEmails } from '@/services/gmail';
import { getMockEmails, MOCK_LABELS } from '@/lib/mockData';

async function authenticate(request: NextRequest): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return 'mock-user-123';
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get('labelId') || undefined;
  const category = searchParams.get('category') || undefined;
  const sentiment = searchParams.get('sentiment') || undefined;
  const searchQuery = searchParams.get('q') || undefined;
  const limitVal = parseInt(searchParams.get('limit') || '50');
  const activeOnly = searchParams.get('activeOnly') === 'true';

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    let emails = getMockEmails(searchQuery, labelId, category, sentiment);
    if (activeOnly) {
      const activeMockLabelIds = MOCK_LABELS.filter(l => l.isActive).map(l => l.labelId);
      emails = emails.filter(e => e.labels.some(lId => activeMockLabelIds.includes(lId)));
    }
    emails = emails.slice(0, limitVal);
    return NextResponse.json({ emails });
  }

  try {
    let queryRef: any = adminDb.collection('emails')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc');

    const hasFilters = labelId || category || sentiment || searchQuery || activeOnly;
    const limitToFetch = hasFilters ? 1000 : limitVal;

    const snapshot = await queryRef.limit(limitToFetch).get();
    let emails = snapshot.docs.map((doc: any) => doc.data());

    // 1. Filter by activeOnly
    if (activeOnly) {
      const activeLabelsSnapshot = await adminDb
        .collection('gmail_labels')
        .where('uid', '==', uid)
        .where('isActive', '==', true)
        .get();

      const activeLabelIds = activeLabelsSnapshot.docs.map((doc: any) => doc.data().labelId);
      if (activeLabelIds.length === 0) {
        return NextResponse.json({ emails: [] });
      }

      emails = emails.filter((email: any) =>
        email.labels && email.labels.some((lId: string) => activeLabelIds.includes(lId))
      );
    }

    // 2. Filter by labelId
    if (labelId) {
      emails = emails.filter((email: any) =>
        email.labels && email.labels.includes(labelId)
      );
    }

    // 3. Filter by category
    if (category) {
      emails = emails.filter((email: any) => email.category === category);
    }

    // 4. Filter by sentiment
    if (sentiment) {
      emails = emails.filter((email: any) => email.sentiment === sentiment);
    }

    // 5. Apply text search query in-memory if provided
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      emails = emails.filter(
        (email: any) =>
          email.subject?.toLowerCase().includes(lowerQuery) ||
          email.from?.toLowerCase().includes(lowerQuery) ||
          email.snippet?.toLowerCase().includes(lowerQuery) ||
          email.body?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply pagination limit
    emails = emails.slice(0, limitVal);

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({ success: true, count: 0, syncedCount: 0 });
  }

  try {
    const { limit } = await request.json().catch(() => ({ limit: 30 }));
    const result = await syncActiveLabelEmails(uid, limit);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error triggering email sync:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
