import { OAuth2Client } from 'google-auth-library';


export interface GoogleIdentity {
  subject: string;
  email: string;
  name: string;
  pictureUrl: string | null;
}

const ACCEPTED_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

let client: OAuth2Client | null = null;

export function isGoogleSignInConfigured(clientId: string): boolean {
  return clientId !== '';
}

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string
): Promise<GoogleIdentity> {
  client ??= new OAuth2Client();

  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();

  if (payload === undefined) throw new Error('Google returned an empty token payload');
  if (!ACCEPTED_ISSUERS.includes(payload.iss)) {
    throw new Error(`Unexpected token issuer ${payload.iss}`);
  }
  if (payload.email === undefined || payload.email_verified !== true) {
    throw new Error('Google account has no verified email address');
  }

  return {
    subject: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email,
    pictureUrl: payload.picture ?? null,
  };
}
