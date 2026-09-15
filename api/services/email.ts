/**
 * Sending email through Resend's HTTP API with `fetch`. One POST is all this
 * service needs, so there is no SDK to install. The base URL is configurable so
 * tests point it at a stub that records every email instead of sending it.
 */

export interface EmailSettings {
  apiKey: string;
  baseUrl: string;
  from: string;
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
  /**
   * Resend returns the original result for a key it has seen in the last 24
   * hours instead of sending again, which is what makes a retry after a crash
   * between sending and recording it safe.
   */
  idempotencyKey: string;
}

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    /** False when sending the same email again cannot succeed, such as a rejected address. */
    readonly isRetryable: boolean
  ) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export function isEmailConfigured(settings: EmailSettings): boolean {
  return settings.apiKey !== '' && settings.from !== '';
}

export async function sendEmail(settings: EmailSettings, email: OutgoingEmail): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/emails`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${settings.apiKey}`,
        'content-type': 'application/json',
        'idempotency-key': email.idempotencyKey,
      },
      body: JSON.stringify({
        from: settings.from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
        headers: email.headers,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new EmailDeliveryError(
      `The email provider could not be reached: ${error instanceof Error ? error.message : String(error)}`,
      true
    );
  }

  if (response.ok) return;

  // Resend answers a validation problem with 4xx; only rate limiting among
  // those is worth trying again.
  const isRetryable = response.status === 429 || response.status >= 500;
  throw new EmailDeliveryError(`The email provider refused the email (${response.status})`, isRetryable);
}
