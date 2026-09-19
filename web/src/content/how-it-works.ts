import { PRODUCT_NAME, PRODUCT_PRICING_NOTE, SITE_URL } from '@/lib/product';
import type { ContentPageCopy } from './content-types';

/**
 * Every factual sentence here must be true of the code that ships and agree
 * with `app/privacy/page.tsx`. When either changes, this changes with it.
 */
export const HOW_IT_WORKS_PAGE: ContentPageCopy = {
  path: '/how-it-works',
  metaTitle: 'How an AI avatar of yourself works',
  metaDescription:
    'Make an AI avatar that answers people in your words, remembers them, and lets you read every chat. How meAsAgent works, step by step.',
  eyebrow: 'How it works',
  heading: 'How an AI avatar of yourself works',
  lede: `An AI avatar on ${PRODUCT_NAME} answers people as you, at a link you share. People type to it and can hear its replies out loud. It remembers the ones who sign in. You can read every chat, and you get a weekly email about who wants to hear from you. ${PRODUCT_PRICING_NOTE}`,
  sections: [
    {
      heading: 'Launching one takes a few minutes',
      paragraphs: [
        'There’s nothing to upload. You write a few short notes about yourself, and the avatar answers from them.',
      ],
      steps: [
        'Sign in with Google. Your avatar uses the name and photo from that account, so it can only be you or something you run.',
        `Pick a handle. Your avatar lives at ${new URL(SITE_URL).host}/your-handle. The handle can’t change later, so links you share keep working.`,
        'Write a short public bio. If you like, add a few topics people can ask about and a link to your website.',
        'Write three private notes for the AI: about you, how you talk, and topics to avoid.',
        'Confirm the avatar is you, and launch. It goes live right away.',
      ],
    },
    {
      heading: 'What visitors get',
      paragraphs: [
        'Anyone with the link can talk to your avatar without an account. They type, and the avatar can read its replies out loud. Every avatar uses the same computer voice. It doesn’t copy yours. Speaking back to it is coming soon.',
        'People who sign in and accept the terms are remembered. When a chat ends, the avatar keeps a short note of what they said, what they care about and anything left open. Next time, it picks up from there. If something was left open and they come back after a while, it follows up once. Notes stay with one avatar. What someone tells one avatar never reaches another.',
        'Someone who signed in can see what an avatar remembers about them and make it forget. Chats without an account are never remembered.',
      ],
    },
    {
      heading: 'What you get as the owner',
      paragraphs: [
        'You can read every chat people have with your avatar, signed in or not, and what it remembers about each person. People who signed in show up with their Google name and photo. Everyone else shows up as a number. You never see anyone’s email address.',
        'Every Monday morning, in your time zone, you can get an email with who talked to your avatar that week, a line or two about each, and anyone who asked for you directly. You can turn it off any time.',
        'People are told this. A line under the message box says the person behind the avatar reads the chats.',
      ],
    },
    {
      heading: 'The directory',
      paragraphs: [
        `The ${PRODUCT_NAME} front page shows avatars people have launched. Yours shows up there as soon as you launch it. We can take an avatar off the front page if it breaks the terms, but its link keeps working.`,
        'Avatars on the front page can show up on Google and other search engines. You can turn that off in your avatar’s settings. The link works either way.',
      ],
    },
    {
      heading: 'What it will and will not do',
      paragraphs: ['An avatar is an AI speaking for you. It isn’t you.'],
      bulletPoints: [
        'It always says it’s an AI when asked. Nothing an owner writes changes that.',
        'It doesn’t make up a life story, and it doesn’t make promises for the owner.',
        'Nothing it says is legal, medical, money or job advice.',
        'It can be wrong and still sound sure.',
        'You can pause your avatar any time. For now, you delete it by sending us an email.',
      ],
    },
    {
      heading: 'What it does not do yet',
      paragraphs: [
        'It doesn’t learn from your documents, posts, videos or podcasts. It only uses the notes you write. It doesn’t copy your voice or make videos of you, and you can’t put it on another website yet. Your avatar is a page at its own link.',
      ],
    },
  ],
  faq: [
    {
      question: 'Can I make an AI version of myself for free?',
      answer: `Yes. Launching an avatar on ${PRODUCT_NAME} is free. ${PRODUCT_PRICING_NOTE}`,
    },
    {
      question: 'Can someone make an AI avatar of me without my permission?',
      answer:
        'Not on meAsAgent. An avatar uses the name and photo from the Google account that launches it, and the owner confirms it’s them or something they run. There’s no way to type in someone else’s name or upload their photo.',
    },
    {
      question: 'Does the avatar tell people it is an AI?',
      answer:
        'Yes. It says it’s an AI whenever someone asks, and nothing the owner writes can change that.',
    },
    {
      question: 'Can I read what people ask my AI avatar?',
      answer:
        'Yes. You can read every chat people have with your avatar, and get a weekly email about who talked to it and who asked for you directly.',
    },
    {
      question: 'Does the avatar remember the people it talks to?',
      answer:
        'It remembers people who sign in and accept the terms: a short note on what they said, what they care about and anything left open. Chats without an account aren’t remembered, and anyone can make an avatar forget them.',
    },
    {
      question: 'Can visitors talk to it by voice?',
      answer:
        'They can hear it. Replies are read out loud, and all avatars use the same computer voice. Your own voice isn’t copied. Speaking to an avatar instead of typing is coming soon.',
    },
    {
      question: 'Do I need to upload documents or train it?',
      answer:
        'No. You write a public bio and three short notes about you, how you talk, and topics to avoid. The avatar answers from those.',
    },
    {
      question: 'Can a product or a brand have an avatar?',
      answer:
        'Yes, if you run it. Launch it from your own Google account and pick “Something I run”.',
    },
    {
      question: 'Will my avatar show up on Google?',
      answer:
        'Yes, it can. You can turn search engines off in your avatar’s settings, and its link works either way.',
    },
    {
      question: 'How do I delete my avatar?',
      answer:
        'You can pause it yourself any time. To delete it, email the address in the privacy notice from the account you signed in with.',
    },
  ],
  related: [
    { href: '/launch', label: 'Launch your avatar' },
    {
      href: '/guides/make-an-ai-version-of-yourself',
      label: 'How to make an AI version of yourself',
    },
    { href: '/compare/delphi', label: 'meAsAgent compared with Delphi' },
    { href: '/privacy', label: 'Privacy notice' },
  ],
  updatedAt: '2026-09-17',
};
