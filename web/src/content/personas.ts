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
    lede: `Customers, candidates, investors and other founders all want a few minutes of your time, and most of them ask the same things. An AI avatar on ${PRODUCT_NAME} answers them as you, at a link you share, and you read every conversation so the ones that matter still reach you. ${PRODUCT_PRICING_NOTE}`,
    sections: [
      {
        heading: 'Where founders put the link',
        paragraphs: [
          'Anywhere people reach out before they have earned a meeting: an email signature, an X or LinkedIn bio, the footer of a company site, a pitch follow-up, a hiring page.',
          'If you would rather the avatar speak for the company than for you, launch it as something you run. It is still launched from your own Google account.',
        ],
      },
      {
        heading: 'What to write in its notes',
        paragraphs: [
          'The avatar answers from what you write about yourself, so write what you find yourself repeating.',
        ],
        bulletPoints: [
          'About you: what you are building and for whom, what stage it is at, what you are hiring for, what kind of intros you welcome.',
          'How you talk: short and direct, or warm and detailed.',
          'Topics to avoid: fundraising terms, numbers you do not share publicly, anything under NDA.',
        ],
      },
      {
        heading: 'Hearing what matters',
        paragraphs: [
          'Every conversation is there for you to read, grouped by visitor. The weekly email says who talked to your avatar and flags anyone who asked for you personally, so a serious enquiry does not sit unread behind a hundred small ones.',
          'Your avatar makes no commitments on your behalf and says it is an AI whenever it is asked, so nobody should mistake a reply from it for a promise from you.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can the avatar speak for my startup rather than for me?',
        answer:
          'Yes. When you launch, choose “Something I run”. It is still launched from your own Google account, and it is never of another person.',
      },
      {
        question: 'Will it make promises to investors or customers?',
        answer:
          'It is instructed never to make commitments on your behalf, and it always says it is an AI when asked. It can still be wrong, so keep sensitive terms in “Topics to avoid”.',
      },
      {
        question: 'Can I see who asked about investing or hiring?',
        answer:
          'You can read every conversation, and the weekly email flags visitors who asked for you personally.',
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
    updatedAt: '2026-09-16',
  },

  creators: {
    path: '/for/creators',
    metaTitle: 'An AI version of yourself for creators',
    metaDescription:
      'Your audience asks more than you can answer. An AI version of you replies by text or voice, remembers returning fans, and shows you what they asked.',
    eyebrow: 'For creators',
    heading: 'An AI version of yourself for creators',
    lede: `An audience asks more questions than one person can answer, and the replies you do not have time for go unwritten. An AI avatar on ${PRODUCT_NAME} answers people as you, by text or voice, remembers the ones who sign in and come back, and lets you read what they asked. ${PRODUCT_PRICING_NOTE}`,
    sections: [
      {
        heading: 'A link for the questions you can’t get to',
        paragraphs: [
          'Put your avatar’s link in your bio, under your videos or at the end of a newsletter. People who would otherwise wait on a DM can ask it about your work, your setup or what you are making next.',
          'The avatar answers from the notes you write, not from your videos or posts, so put the answers you give most often into “About you”.',
        ],
      },
      {
        heading: 'It remembers the people who return',
        paragraphs: [
          'Visitors who sign in and accept the terms are remembered: what they told it, what they care about, anything they left unfinished. When they come back it picks up from there, and it follows up once on something left open. Anonymous visitors are not remembered, and anyone can make an avatar forget them.',
        ],
      },
      {
        heading: 'You still hear from your audience',
        paragraphs: [
          'You read every conversation, and the weekly email tells you who talked to your avatar and who asked for you personally. That is often the most useful part: a record of what your audience actually wants to know.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does it sound like me?',
        answer:
          'Its words follow your “How you talk” note. When it speaks aloud it uses one synthetic voice shared by every avatar; your own voice is not cloned.',
      },
      {
        question: 'Can I add my videos or posts so it knows my content?',
        answer: 'Not yet. It answers from the bio and notes you write.',
      },
      {
        question: 'Do my followers need an account to talk to it?',
        answer:
          'No. Anyone with the link can talk to it. Only visitors who sign in and accept the terms are remembered between conversations.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/for/teachers', label: 'For teachers' },
      { href: '/compare/delphi', label: 'meAsAgent compared with Delphi' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    updatedAt: '2026-09-16',
  },

  teachers: {
    path: '/for/teachers',
    metaTitle: 'An AI avatar that answers your students',
    metaDescription:
      'Students ask the same questions outside class. An AI avatar of you answers at a link you share, and you read what they asked. How it works for teachers.',
    eyebrow: 'For teachers',
    heading: 'An AI avatar that answers your students between classes',
    lede: `Students and their families ask the same questions outside class hours: when office hours are, how a course is structured, what to read first. An AI avatar on ${PRODUCT_NAME} answers them as you, at a link you share, and you read every conversation to see where people are stuck. ${PRODUCT_PRICING_NOTE}`,
    sections: [
      {
        heading: 'Good questions for an avatar, and bad ones',
        paragraphs: [
          'An avatar answers from the notes you write about yourself. That makes it good at the questions you already answer the same way every time, and a poor substitute for teaching.',
        ],
        bulletPoints: [
          'Good: how you run your course, how to reach you, what you expect in an assignment, what you recommend reading.',
          'Not for it: grades, marking decisions, anything about an individual student, anything a student needs a person for.',
        ],
      },
      {
        heading: 'Seeing where students get stuck',
        paragraphs: [
          'You can read every conversation. Students who sign in appear by their Google name and photo, others by a number, and nobody’s email address is shown to you. The weekly email summarises who talked to your avatar and flags anyone who asked for you personally.',
          'Students are told that you read the conversations: a line under the message box says so.',
        ],
      },
      {
        heading: 'Before you share it',
        paragraphs: [
          'Check your school’s rules on AI tools and on students using external services before sharing the link. Put anything you must not discuss in “Topics to avoid”, and remember the avatar can be wrong.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is it safe for students to talk to?',
        answer:
          'It says it is an AI when asked, avoids the topics you list, and gives no professional advice. It can still be wrong, and conversations are stored and read by you, so students should not share anything private with it.',
      },
      {
        question: 'Can it mark work or give grades?',
        answer:
          'No. It only has the notes you write, and it makes no commitments on your behalf. Keep grading out of its topics.',
      },
      {
        question: 'Do students need to sign in?',
        answer:
          'No. Signing in is optional; it only decides whether the avatar remembers a student between conversations.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/for/founders', label: 'For founders' },
      { href: '/privacy', label: 'Privacy notice' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    updatedAt: '2026-09-16',
  },
};

export const PERSONA_SLUGS = Object.keys(PERSONA_PAGES) as PersonaSlug[];

export function isPersonaSlug(slug: string): slug is PersonaSlug {
  return Object.hasOwn(PERSONA_PAGES, slug);
}
