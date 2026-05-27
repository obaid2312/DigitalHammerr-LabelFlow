import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { analyzeEmailWithAI } from '@/services/gemini';

async function authenticate(request: NextRequest): Promise<string | null> {
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
    const { emailId } = await request.json();
    if (!emailId) {
      return NextResponse.json({ error: 'Missing emailId' }, { status: 400 });
    }

    const email = await analyzeEmailWithAI(uid, emailId);
    return NextResponse.json({ 
      success: true, 
      sentiment: email.sentiment,
      category: email.category 
    });
  } catch (error: any) {
    console.error('Error in AI sentiment analysis:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
