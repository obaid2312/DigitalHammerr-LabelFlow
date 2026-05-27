import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { sendGmailReply } from '@/services/gmail';
import { generateReplySuggestion } from '@/services/gemini';

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

export async function POST(request: NextRequest) {
  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, emailId, replyBody } = await request.json();

    if (!emailId) {
      return NextResponse.json({ error: 'Missing emailId' }, { status: 400 });
    }

    if (action === 'suggest') {
      if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
        const mockSuggestions = [
          "Hi,\n\nThanks for reaching out! I've received your email and will look into it shortly.\n\nBest regards,\nMd. Obaidullah Ansari",
          "Hello,\n\nThank you for the message. I would be happy to discuss this further. Let me know if you have time for a quick call this week.\n\nBest regards,\nMd. Obaidullah Ansari",
          "Dear Sender,\n\nThank you for your inquiry. We have forwarded this to our support team and will get back to you with an update soon.\n\nBest regards,\nMd. Obaidullah Ansari"
        ];
        const randomSuggestion = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)];
        return NextResponse.json({ suggestion: randomSuggestion });
      }

      const suggestion = await generateReplySuggestion(uid, emailId);
      return NextResponse.json({ suggestion });
    }

    if (action === 'send') {
      if (!replyBody || replyBody.trim() === '') {
        return NextResponse.json({ error: 'Missing replyBody' }, { status: 400 });
      }

      if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
        console.log(`[MOCK] Sending reply to email ${emailId}: ${replyBody}`);
        return NextResponse.json({ success: true, message: 'Mock reply sent successfully' });
      }

      const result = await sendGmailReply(uid, emailId, replyBody);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid action. Must be "send" or "suggest"' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling gmail reply API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
