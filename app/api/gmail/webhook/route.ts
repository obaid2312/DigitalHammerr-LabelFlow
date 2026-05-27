import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { syncActiveLabelEmails } from '@/services/gmail';

interface PubSubMessage {
  message: {
    data: string;
    messageId: string;
  };
  subscription: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PubSubMessage = await request.json();
    
    if (!body || !body.message || !body.message.data) {
      return NextResponse.json({ error: 'Invalid Pub/Sub message format' }, { status: 400 });
    }

    // Decode base64 data payload
    const decodedString = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const data = JSON.parse(decodedString);

    const emailAddress = data.emailAddress;
    if (!emailAddress) {
      return NextResponse.json({ error: 'Missing emailAddress in Pub/Sub data' }, { status: 200 }); // Return 200 to acknowledge Pub/Sub
    }

    console.log(`Received real-time Pub/Sub sync trigger for: ${emailAddress}`);

    // Map email address to Firebase UID
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', emailAddress)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.warn(`No user found with email ${emailAddress} for Pub/Sub webhook.`);
      return NextResponse.json({ message: 'No user registered' }, { status: 200 });
    }

    const uid = usersSnapshot.docs[0].id;

    // Trigger sync in background
    syncActiveLabelEmails(uid, 15).catch((err) => {
      console.error(`Background real-time sync failed for user ${uid}:`, err);
    });

    return NextResponse.json({ success: true, message: 'Sync triggered' }, { status: 200 });
  } catch (error: any) {
    console.error('Pub/Sub Webhook processing failed:', error);
    // Always return 200 to Pub/Sub to prevent infinite retries unless it's a critical error
    return NextResponse.json({ error: error.message || 'Internal processing error' }, { status: 200 });
  }
}
export const dynamic = 'force-dynamic';
