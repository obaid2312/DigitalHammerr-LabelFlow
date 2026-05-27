import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { analyzeEmailWithAI } from '@/services/gemini';
import { syncEmailById, fetchEmailThread } from '@/services/gmail';
import { getMockEmailDetail } from '@/lib/mockData';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: emailId } = await params;
  if (!emailId) {
    return NextResponse.json({ error: 'Missing emailId' }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    const emailData = getMockEmailDetail(emailId);
    if (!emailData) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }
    const mockThread = [
      {
        ...emailData,
        messageId: 'mock-msg-1',
        from: 'Client <client@example.com>',
        to: 'Md. Obaidullah Ansari <obaidansari2312@gmail.com>',
        body: 'Hi, I would like to know the pricing details for your SaaS product. Do you have bulk discounts?',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        ...emailData,
        messageId: 'mock-msg-2',
        from: 'Md. Obaidullah Ansari <obaidansari2312@gmail.com>',
        to: 'Client <client@example.com>',
        body: 'Hello!\n\nThank you for reaching out. Our pricing starts at $49/mo. We also offer custom enterprise plans with bulk discounts.\n\nBest regards,\nMd. Obaidullah Ansari',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        ...emailData,
        body: emailData.body || 'Hi, just confirming if you received my message!',
        timestamp: emailData.timestamp,
      }
    ];
    return NextResponse.json({ email: emailData, thread: mockThread });
  }

  try {
    // 1. Check if email exists in Firestore
    const emailRef = adminDb.collection('emails').doc(`${uid}_${emailId}`);
    let emailDoc = await emailRef.get();

    // 2. If it does not exist in Firestore, fetch it from Gmail and save it
    if (!emailDoc.exists) {
      try {
        await syncEmailById(uid, emailId);
        emailDoc = await emailRef.get();
      } catch (err: any) {
        return NextResponse.json({ error: 'Email not found in Gmail' }, { status: 404 });
      }
    }

    let emailData = emailDoc.data();

    // 3. Trigger AI analysis on-the-fly if it has not been done yet
    if (emailData && !emailData.aiSummary) {
      try {
        emailData = await analyzeEmailWithAI(uid, emailId);
      } catch (aiErr) {
        console.error('On-the-fly AI analysis failed:', aiErr);
      }
    }

    // 4. Fetch thread trailing
    let threadMessages: any[] = [];
    try {
      if (emailData && emailData.threadId) {
        threadMessages = await fetchEmailThread(uid, emailData.threadId);
      }
    } catch (threadErr) {
      console.error('Failed to fetch thread messages:', threadErr);
      if (emailData) {
        threadMessages = [emailData];
      }
    }

    return NextResponse.json({ email: emailData, thread: threadMessages });
  } catch (error: any) {
    console.error(`Error fetching email detail for ${emailId}:`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
