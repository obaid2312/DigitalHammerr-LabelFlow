import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid') || '';

  const protocol = request.nextUrl.protocol;
  const host = request.headers.get('host') || 'localhost:3000';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}//${host}/api/auth/callback`;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google Client ID or Client Secret not configured in environment variables.' },
      { status: 500 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent', // Force consent prompt to get a refresh token
    state: uid || undefined,
  });

  return NextResponse.redirect(authorizationUrl);
}
export const dynamic = 'force-dynamic';
