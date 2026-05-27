import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { encrypt } from '@/lib/crypto';
import { OAuthTokens, UserProfile } from '@/types';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateUid = searchParams.get('state'); // Potential UID if passed from front-end

  const protocol = request.nextUrl.protocol;
  const host = request.headers.get('host') || 'localhost:3000';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}//${host}/api/auth/callback`;

  if (!code) {
    return NextResponse.redirect(`${protocol}//${host}/auth/error?error=MissingAuthorizationCode`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      redirectUri
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return NextResponse.redirect(`${protocol}//${host}/auth/error?error=EmailNotProvided`);
    }

    const email = profile.email;
    const displayName = profile.name || email.split('@')[0];
    const photoURL = profile.picture || '';

    let uid = stateUid || '';

    // If no UID was provided, find or create user in Firebase Auth
    if (!uid) {
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          const newUser = await adminAuth.createUser({
            email,
            displayName,
            photoURL,
            emailVerified: true,
          });
          uid = newUser.uid;
        } else {
          throw error;
        }
      }
    }

    // Save/Update user profile in Firestore
    const userProfile: UserProfile = {
      uid,
      name: displayName,
      email,
      avatar: photoURL,
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection('users').doc(uid).set(userProfile, { merge: true });

    // Store encrypted tokens if refresh token is present
    // Note: Google only sends refreshToken on first consent or if prompt=consent is used
    if (tokens.refresh_token) {
      const encryptedRefreshToken = encrypt(tokens.refresh_token);
      const tokenData: OAuthTokens = {
        uid,
        accessToken: tokens.access_token || '',
        refreshToken: encryptedRefreshToken,
        expiry: tokens.expiry_date || Date.now() + 3600 * 1000,
        scopes: tokens.scope ? tokens.scope.split(' ') : [],
      };
      await adminDb.collection('oauth_tokens').doc(uid).set(tokenData);
    } else {
      // If we didn't get a refresh token, check if we already have one stored
      const existingTokenDoc = await adminDb.collection('oauth_tokens').doc(uid).get();
      if (!existingTokenDoc.exists) {
        // We need to re-request consent because we don't have a refresh token
        const reauthUrl = `${protocol}//${host}/api/auth/google?uid=${uid}`;
        return NextResponse.redirect(reauthUrl);
      }
      
      // Update the access token and expiry
      const updateData: Partial<OAuthTokens> = {
        accessToken: tokens.access_token || '',
        expiry: tokens.expiry_date || Date.now() + 3600 * 1000,
      };
      await adminDb.collection('oauth_tokens').doc(uid).update(updateData);
    }

    // Create Firebase custom auth token for client login
    const customToken = await adminAuth.createCustomToken(uid);

    // Redirect to the client callback handler
    const responseUrl = new URL('/auth/callback', `${protocol}//${host}`);
    responseUrl.searchParams.set('token', customToken);
    responseUrl.searchParams.set('email', email);
    
    return NextResponse.redirect(responseUrl.toString());
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(`${protocol}//${host}/auth/error?error=OAuthExchangeFailed`);
  }
}
export const dynamic = 'force-dynamic';
