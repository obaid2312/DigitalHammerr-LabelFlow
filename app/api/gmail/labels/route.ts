import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { fetchGmailLabels, syncActiveLabelEmails } from '@/services/gmail';
import { MOCK_LABELS, toggleMockLabel } from '@/lib/mockData';

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
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const labels = [...MOCK_LABELS];
    labels.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'user' ? -1 : 1;
      }
      return a.labelName.localeCompare(b.labelName);
    });
    return NextResponse.json({ labels });
  }

  try {
    if (forceRefresh) {
      await fetchGmailLabels(uid);
    }

    // Retrieve from Firestore
    let snapshot = await adminDb
      .collection('gmail_labels')
      .where('uid', '==', uid)
      .get();

    let labels = snapshot.docs.map((doc) => doc.data());
    
    // Auto-fetch if no labels exist in Firestore
    if (labels.length === 0 && !forceRefresh) {
      try {
        await fetchGmailLabels(uid);
        snapshot = await adminDb
          .collection('gmail_labels')
          .where('uid', '==', uid)
          .get();
        labels = snapshot.docs.map((doc) => doc.data());
      } catch (fetchErr) {
        console.error('Auto-fetching labels failed:', fetchErr);
      }
    }

    // Sort custom labels first, then system labels, and alphabetical
    labels.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'user' ? -1 : 1;
      }
      return a.labelName.localeCompare(b.labelName);
    });

    return NextResponse.json({ labels });
  } catch (error: any) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { labelId, isActive } = await request.json();
    if (!labelId) {
      return NextResponse.json({ error: 'Missing labelId' }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      toggleMockLabel(labelId, isActive);
      return NextResponse.json({ success: true, labelId, isActive });
    }

    const labelDocRef = adminDb.collection('gmail_labels').doc(`${uid}_${labelId}`);
    
    // Update the local Firestore record
    await labelDocRef.update({ isActive });

    // If activated, trigger a quick background sync for this label
    if (isActive) {
      // Sync in background to not block the response
      syncActiveLabelEmails(uid, 15).catch((err) => {
        console.error(`Background label sync failed for ${labelId}:`, err);
      });
    }

    return NextResponse.json({ success: true, labelId, isActive });
  } catch (error: any) {
    console.error('Error updating label:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
