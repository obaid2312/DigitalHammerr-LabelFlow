import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { syncActiveLabelEmails } from '@/services/gmail';
import { getMockEmails } from '@/lib/mockData';

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

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const emails = getMockEmails(searchQuery, labelId, category, sentiment).slice(0, limitVal);
    return NextResponse.json({ emails });
  }

  try {
    let queryRef: any = adminDb.collection('emails').where('uid', '==', uid);

    if (labelId) {
      queryRef = queryRef.where('labels', 'array-contains', labelId);
    }
    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    if (sentiment) {
      queryRef = queryRef.where('sentiment', '==', sentiment);
    }

    // Order by timestamp descending
    queryRef = queryRef.orderBy('timestamp', 'desc');

    // Fetch documents
    const snapshot = await queryRef.limit(limitVal * 2).get(); // fetch slightly more to allow search filtering in-memory
    let emails = snapshot.docs.map((doc: any) => doc.data());

    // Apply text search query in-memory if provided
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
