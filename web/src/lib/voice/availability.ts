/**
 * Hold-to-speak is switched off for now. It needs the standalone
 * speech-to-speech service, which has nowhere to run next to the deployed api,
 * so on the live site the button could only ever fail in front of a visitor.
 * Better to say the feature is on its way than to ship one that breaks.
 *
 * This constant is the whole switch: turn it back on and the hook connects
 * again and the bar stops saying "coming soon".
 */
export const IS_LIVE_VOICE_ENABLED = false;

/** What the push-to-talk bar promises while the feature is off. */
export const LIVE_VOICE_COMING_SOON_LABEL = 'Talk out loud';
