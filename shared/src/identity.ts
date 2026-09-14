export interface UserProfile {
  id: string;
  name: string;
  email: string;
  pictureUrl: string | null;
  consentAcceptedAt: string | null;
}

export interface GoogleSignInRequest {
  idToken: string;
}

export interface SignInResponse {
  sessionToken: string;
  sessionExpiresAt: string;
  user: UserProfile;
  claimedThreadCount: number;
}

export interface SessionResponse {
  user: UserProfile;
}

export interface ConsentResponse {
  consentAcceptedAt: string | null;
}

export interface OpenVoiceSessionRequest {
  chatId: string;
}

export interface OpenVoiceSessionResponse {
  routeMarker: string;
}
