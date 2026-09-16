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
    'Launch an AI avatar that answers people by text or voice, remembers them, and lets you read every conversation. How meAsAgent works, step by step.',
  eyebrow: 'How it works',
  heading: 'How an AI avatar of yourself works',
  lede: `An AI avatar on ${PRODUCT_NAME} is an AI that answers people as you, at a link you share. Visitors talk to it by text or voice, it remembers the people who sign in, and you read every conversation and get a weekly summary of who needs you. ${PRODUCT_PRICING_NOTE}`,
  sections: [
    {
      heading: 'Launching one takes a few minutes',
      paragraphs: [
        'There is nothing to upload. You describe yourself in a few short notes, and the avatar answers from them.',
      ],
      steps: [
        'Sign in with Google. Your avatar takes its name and photo from that account, so it can only be of you — or of something you run, launched from your own account.',
        `Pick a handle. Your avatar lives at ${new URL(SITE_URL).host}/your-handle, and the handle cannot change later, so links you share keep working.`,
        'Write a short public bio, and optionally a few topics people can ask about and a link to your own website.',
        'Write three notes only the model reads: about you, how you talk, and topics to avoid.',
        'Confirm the avatar is of you, and launch. It is live at its link straight away.',
      ],
    },
    {
      heading: 'What visitors get',
      paragraphs: [
        'Anyone with the link can talk to your avatar without an account, by typing or by holding a button to speak, and it can read its replies aloud. Every avatar speaks in the same synthetic voice; it does not clone yours.',
        'Visitors who sign in and accept the terms are remembered. After a conversation goes quiet, the avatar keeps a short note of what they told it, the topics they care about and anything left unfinished, and picks up from there next time. If something was left open and they have been away a while, it follows up once when they come back. Each avatar’s notes are its own: what someone tells one avatar never reaches another.',
        'A signed-in visitor can see what an avatar remembers about them and make it forget. Anonymous conversations are never remembered.',
      ],
    },
    {
      heading: 'What you get as the owner',
      paragraphs: [
        'You read every conversation people have with your avatar, signed in or not, together with what it remembers about each visitor. Signed-in visitors appear by their Google name and photo, anonymous ones by a number, and you never see anyone’s email address.',
        'Every Monday morning, in your time zone, you can get an email saying who talked to your avatar that week, a line or two about each, and anyone who asked for you personally. You can turn it off at any time.',
        'Visitors are told this: a line under the message box says the person behind the avatar reads the conversations.',
      ],
    },
    {
      heading: 'The directory',
      paragraphs: [
        `The ${PRODUCT_NAME} front page lists avatars that have been reviewed. Your avatar works at its link from the moment you launch it; review only decides whether it also appears in the directory. Changing your bio, your topics or your website sends it back for review.`,
        'Listed avatars can appear in search engines such as Google. You can turn that off in your avatar’s settings, and the link keeps working either way.',
      ],
    },
    {
      heading: 'What it will and will not do',
      paragraphs: ['An avatar is an AI speaking for you, not you.'],
      bulletPoints: [
        'It always says it is an AI when asked, and nothing an owner writes changes that.',
        'It does not invent a biography, and it makes no commitments on the owner’s behalf.',
        'Nothing it says is legal, medical, financial or employment advice.',
        'It can be wrong, and can state something false with confidence.',
        'You can pause your avatar at any time. Deleting it is done by email for now.',
      ],
    },
    {
      heading: 'What it does not do yet',
      paragraphs: [
        'It does not learn from your documents, posts, videos or podcasts — only from the notes you write. It does not clone your voice or make a video of you, and it cannot be embedded in another website. Your avatar is a page at its link.',
      ],
    },
  ],
  faq: [
    {
      question: 'Can I make an AI version of myself for free?',
      answer: `Yes. Launching an avatar on ${PRODUCT_NAME} costs nothing. ${PRODUCT_PRICING_NOTE}`,
    },
    {
      question: 'Can someone make an AI avatar of me without my permission?',
      answer:
        'Not on meAsAgent. An avatar takes its name and photo from the Google account that launches it, and the owner confirms it is of them or of something they run. There is no field to type in someone else’s name or upload their photo.',
    },
    {
      question: 'Does the avatar tell people it is an AI?',
      answer:
        'Yes. It says it is an AI whenever it is asked, and nothing the owner writes can change that.',
    },
    {
      question: 'Can I read what people ask my AI avatar?',
      answer:
        'Yes. You can read every conversation visitors have with your avatar, and get a weekly email summarising who talked to it and who asked for you personally.',
    },
    {
      question: 'Does the avatar remember the people it talks to?',
      answer:
        'It remembers visitors who sign in and accept the terms: a short summary of what they said, their interests and anything left unfinished. Anonymous conversations are not remembered, and a visitor can make an avatar forget them.',
    },
    {
      question: 'Can visitors talk to it by voice?',
      answer:
        'Yes. Visitors can hold a button to speak and hear the reply read aloud. All avatars share one synthetic voice; your own voice is not cloned.',
    },
    {
      question: 'Do I need to upload documents or train it?',
      answer:
        'No. You write a public bio and three short notes — about you, how you talk, and topics to avoid — and the avatar answers from those.',
    },
    {
      question: 'Can a product or a brand have an avatar?',
      answer:
        'Yes, if you run it. Launch it from your own Google account and choose “Something I run” when you launch.',
    },
    {
      question: 'Will my avatar show up on Google?',
      answer:
        'Once it has been reviewed and listed, it can. You can turn search engines off in your avatar’s settings, and its link keeps working either way.',
    },
    {
      question: 'How do I delete my avatar?',
      answer:
        'You can pause it yourself at any time. To delete it, write to the address in the privacy notice from the account you signed in with.',
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
  updatedAt: '2026-09-16',
};
