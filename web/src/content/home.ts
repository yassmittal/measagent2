import { PRODUCT_NAME, PRODUCT_PRICING_NOTE } from '@/lib/product';
import type { ContentSection } from './content-types';

/**
 * The explanation under the directory. It is the only prose a search engine
 * reads on the front page, so it says plainly what the product is and does.
 */
export const HOME_INTRODUCTION: ContentSection = {
  heading: `What is ${PRODUCT_NAME}?`,
  paragraphs: [
    `${PRODUCT_NAME} hosts AI avatars of real people and of the things they build. Each avatar answers as the person who launched it, from notes they wrote themselves, at its own link. Talk to one by typing or by holding a button to speak — no account needed.`,
    'Busy founders, creators and teachers cannot answer everyone. Their avatar answers for them, remembers the visitors who sign in, and they read every conversation and get a weekly email about who needs them personally. Every avatar says it is an AI whenever it is asked.',
  ],
  steps: [
    'Sign in with Google — your avatar takes its name and photo from that account, so it can only be of you or of something you run.',
    'Write a short bio and three notes: about you, how you talk, and what to avoid.',
    'Share your link. The avatar is live straight away and joins this directory once it has been reviewed.',
  ],
};

export const HOME_LAUNCH_NOTE = `Launch yours in a few minutes. ${PRODUCT_PRICING_NOTE}`;
