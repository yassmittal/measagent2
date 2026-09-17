import { PRODUCT_NAME, PRODUCT_PRICING_NOTE } from '@/lib/product';
import type { ContentSection } from './content-types';

/**
 * The explanation under the directory. It is the only prose a search engine
 * reads on the front page, so it says plainly what the product is and does.
 */
export const HOME_INTRODUCTION: ContentSection = {
  heading: `What is ${PRODUCT_NAME}?`,
  paragraphs: [
    `${PRODUCT_NAME} lets you make an AI version of yourself, or of something you run. It answers people for you, using notes you write, at its own link. Anyone can talk to it by typing or by holding a button to speak. No account needed.`,
    'Busy founders, creators and teachers can’t reply to everyone. Their avatar replies for them and remembers people who sign in. They can read every chat, and each week they get an email about who wants to hear from them directly. Every avatar says it’s an AI if you ask.',
  ],
  steps: [
    'Sign in with Google. Your avatar uses the name and photo from that account, so it can only be you or something you run.',
    'Write a short bio and three notes: about you, how you talk, and what to avoid.',
    'Share your link. Your avatar goes live right away and shows up on this page too.',
  ],
};

export const HOME_LAUNCH_NOTE = `Launch yours in a few minutes. ${PRODUCT_PRICING_NOTE}`;
