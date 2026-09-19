import { PRODUCT_NAME, PRODUCT_PRICING_NOTE } from '@/lib/product';
import type { ContentPageCopy } from './content-types';

export type PersonaSlug = 'founders' | 'creators' | 'teachers';

/**
 * One page per kind of busy person. Each describes a real scenario in the
 * product as it ships — no claims about outcomes, revenue or advice — and
 * leaves the how-to to the guide and the mechanism to how-it-works.
 */
export const PERSONA_PAGES: Record<PersonaSlug, ContentPageCopy> = {
  founders: {
    path: '/for/founders',
    metaTitle: 'An AI avatar for founders',
    metaDescription:
      'Founders get the same questions from customers, candidates and investors. An AI avatar answers them at your link, and you read what they asked.',
    eyebrow: 'For founders',
    heading: 'An AI avatar for founders who can’t answer everyone',
    lede: `Customers, candidates, investors and other founders all want a few minutes of your time, and most of them ask the same things. An AI avatar on ${PRODUCT_NAME} answers them as you, at a link you share. You read every chat, so the ones that matter still reach you. ${PRODUCT_PRICING_NOTE}`,
    sections: [
      {
        heading: 'Where founders put the link',
        paragraphs: [
          'Anywhere people reach out before a meeting makes sense: your email signature, your X or LinkedIn bio, your company site, a pitch follow-up, a hiring page.',
          'If you’d rather the avatar speak for the company than for you, launch it as something you run. You still launch it from your own Google account.',
        ],
      },
      {
        heading: 'What to write in its notes',
        paragraphs: [
          'The avatar answers from what you write about yourself, so write down the things you keep repeating.',
        ],
        bulletPoints: [
          'About you: what you’re building and for whom, what stage it’s at, who you’re hiring, and what intros you want.',
          'How you talk: short and direct, or warm and detailed.',
          'Topics to avoid: fundraising terms, numbers you don’t share publicly, anything under NDA.',
        ],
      },
      {
        heading: 'Hearing what matters',
        paragraphs: [
          'You can read every chat, grouped by person. The weekly email tells you who talked to your avatar and points out anyone who asked for you directly, so a serious lead doesn’t get lost behind a hundred small questions.',
          'Your avatar doesn’t make promises for you and says it’s an AI whenever someone asks, so nobody should take its reply as a promise from you.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can the avatar speak for my startup rather than for me?',
        answer:
          'Yes. When you launch, pick “Something I run”. You still launch it from your own Google account, and it can never be another person.',
      },
      {
        question: 'Will it make promises to investors or customers?',
        answer:
          'It’s told never to make promises for you, and it always says it’s an AI when asked. It can still be wrong, so put anything sensitive in “Topics to avoid”.',
      },
      {
        question: 'Can I see who asked about investing or hiring?',
        answer:
          'You can read every chat, and the weekly email points out people who asked for you directly.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How it works' },
      {
        href: '/guides/make-an-ai-version-of-yourself',
        label: 'How to make an AI version of yourself',
      },
      { href: '/for/creators', label: 'For creators' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    updatedAt: '2026-09-17',
  },

  creators: {
    path: '/for/creators',
    metaTitle: 'An AI version of yourself for creators',
    metaDescription:
      'Your audience asks more than you can answer. An AI version of you replies in your own words, remembers fans who come back, and shows you what they asked.',
    eyebrow: 'For creators',
    heading: 'An AI version of yourself for creators',
    lede: `Your audience asks more questions than one person can answer. An AI avatar on ${PRODUCT_NAME} answers them as you, in your own words. It remembers the people who sign in and come back, and you can read what they asked. ${PRODUCT_PRICING_NOTE}`,
    sections: [
      {
        heading: 'A link for the questions you can’t get to',
        paragraphs: [
          'Put your avatar’s link in your bio, under your videos or at the end of a newsletter. People who would wait on a DM can ask it about your work, your setup or what you’re making next.',
          'The avatar answers from the notes you write, not from your videos or posts. So put the answers you give most often into “About you”.',
        ],
      },
      {
        heading: 'It remembers the people who return',
        paragraphs: [
          'People who sign in and accept the terms are remembered: what they said, what they care about, and anything left open. When they come back, it picks up from there and follows up once on anything left open. People without an account aren’t remembered, and anyone can make an avatar forget them.',
        ],
      },
      {
        heading: 'You still hear from your audience',
        paragraphs: [
          'You can read every chat, and the weekly email tells you who talked to your avatar and who asked for you directly. This is often the best part. You see what your audience really wants to know.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does it sound like me?',
        answer:
          'Its words follow your “How you talk” note. When it speaks out loud, it uses the same computer voice as every other avatar. Your own voice isn’t copied.',
      },
      {
        question: 'Can I add my videos or posts so it knows my content?',
        answer: 'Not yet. It answers from the bio and notes you write.',
      },
      {
        question: 'Do my followers need an account to talk to it?',
        answer:
          'No. Anyone with the link can talk to it. Only people who sign in and accept the terms are remembered between chats.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/for/teachers', label: 'For teachers' },
      { href: '/compare/delphi', label: 'meAsAgent compared with Delphi' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    updatedAt: '2026-09-17',
  },

  teachers: {
    path: '/for/teachers',
    metaTitle: 'An AI avatar that answers your students',
    metaDescription:
      'Students ask the same questions outside class. An AI avatar of you answers at a link you share, and you read what they asked. How it works for teachers.',
    eyebrow: 'For teachers',
    heading: 'An AI avatar that answers your students between classes',
    lede: `Students and their families ask the same questions outside class: when office hours are, how a course works, what to read first. An AI avatar on ${PRODUCT_NAME} answers them as you, at a link you share. You read every chat and see where people get stuck. ${PRODUCT_PRICING_NOTE}`,
    sections: [
      {
        heading: 'Good questions for an avatar, and bad ones',
        paragraphs: [
          'An avatar answers from the notes you write about yourself. So it’s good at the questions you answer the same way every time. It can’t replace teaching.',
        ],
        bulletPoints: [
          'Good: how you run your course, how to reach you, what you expect in an assignment, what you recommend reading.',
          'Not for it: grades, marking decisions, anything about an individual student, anything a student needs a person for.',
        ],
      },
      {
        heading: 'Seeing where students get stuck',
        paragraphs: [
          'You can read every chat. Students who sign in show up with their Google name and photo, everyone else as a number, and you never see anyone’s email address. The weekly email tells you who talked to your avatar and points out anyone who asked for you directly.',
          'Students are told that you read the chats. A line under the message box says so.',
        ],
      },
      {
        heading: 'Before you share it',
        paragraphs: [
          'Check your school’s rules on AI tools and outside apps before you share the link. Put anything you can’t discuss in “Topics to avoid”, and remember the avatar can be wrong.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is it safe for students to talk to?',
        answer:
          'It says it’s an AI when asked, avoids the topics you list, and doesn’t give professional advice. It can still be wrong, and you can read the chats, so students shouldn’t share anything private with it.',
      },
      {
        question: 'Can it mark work or give grades?',
        answer:
          'No. It only knows the notes you write, and it doesn’t make promises for you. Keep grading out of its topics.',
      },
      {
        question: 'Do students need to sign in?',
        answer:
          'No. Signing in is optional. It only decides whether the avatar remembers a student between chats.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/for/founders', label: 'For founders' },
      { href: '/privacy', label: 'Privacy notice' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    updatedAt: '2026-09-17',
  },
};

export const PERSONA_SLUGS = Object.keys(PERSONA_PAGES) as PersonaSlug[];

export function isPersonaSlug(slug: string): slug is PersonaSlug {
  return Object.hasOwn(PERSONA_PAGES, slug);
}
