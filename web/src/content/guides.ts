import { PRODUCT_NAME, PRODUCT_PRICING_NOTE } from '@/lib/product';
import type { ArticleCopy } from './content-types';

export type GuideSlug = 'make-an-ai-version-of-yourself';

export const GUIDES: Record<GuideSlug, ArticleCopy> = {
  'make-an-ai-version-of-yourself': {
    path: '/guides/make-an-ai-version-of-yourself',
    metaTitle: 'How to make an AI version of yourself',
    metaDescription:
      'Make an AI clone of yourself that answers people by text or voice: what to decide, what to write, and three ways to build one, including a free one.',
    eyebrow: 'Guide',
    heading: 'How to make an AI version of yourself that answers people',
    lede: 'An AI version of yourself — people also call it an AI clone, a digital twin or an AI avatar — is a chatbot that answers as you. To make one, decide who it is for, write down what it should know and how you talk, pick a tool that turns those notes into a conversation, and share the link where people already try to reach you.',
    sections: [
      {
        heading: 'First, decide what kind you need',
        paragraphs: [
          '“AI clone” means three different things, and the tools barely overlap.',
        ],
        bulletPoints: [
          'A video clone makes videos of your face saying a script. It does not hold a conversation.',
          'A voice clone reads text aloud in your voice.',
          'A conversational clone — the subject of this guide — answers questions as you, by text and often by voice.',
        ],
      },
      {
        heading: 'Decide who it answers, and what for',
        paragraphs: [
          'Write down the three or four questions people ask you most, and who asks them. A founder fielding the same investor questions needs different notes from a teacher answering students, and both are better served by an AI that knows a few things well than by one that knows a little about everything.',
        ],
      },
      {
        heading: 'Write what it should know',
        paragraphs: [
          'Whichever tool you use, the quality of the answers comes from what you give it. Four short pieces of writing go a long way:',
        ],
        bulletPoints: [
          'A public bio: one or two sentences that tell a visitor who they are talking to.',
          'About you: your work, what you are building, what you believe, and the answers you give most often.',
          'How you talk: short or detailed, formal or casual, words you use and words you never would.',
          'Topics to avoid: what it should decline to discuss — private matters, numbers you do not share, anything that needs you in person.',
        ],
      },
      {
        heading: 'Pick how to build it',
        paragraphs: [
          'There are three broad routes. Prices and features change often; check each tool’s own site before choosing.',
        ],
        bulletPoints: [
          `A hosted avatar you launch in minutes, such as ${PRODUCT_NAME}: sign in, write the notes above, and share the link. Visitors talk by text or voice, it remembers visitors who sign in, and you read every conversation. It does not learn from uploaded documents. ${PRODUCT_PRICING_NOTE}`,
          'A platform trained on your existing work, such as Delphi: you connect writing, talks or podcasts so answers draw on them, usually with paid tiers for more material and integrations.',
          'A custom GPT or your own build: flexible and cheap to start, but you handle sharing, memory and reading conversations yourself.',
        ],
      },
      {
        heading: 'Launch it on meAsAgent, step by step',
        paragraphs: ['If you choose the hosted route here, this is the whole process.'],
        steps: [
          'Open the launch page and sign in with Google. The avatar’s name and photo come from that account.',
          'Choose whether the avatar is of you or of something you run, such as a product or a company.',
          'Pick a handle — it becomes your link and cannot change.',
          'Write the bio and the three notes. Add a few “Ask me about” topics and your website if you want them on the page.',
          'Confirm and launch. Your avatar is live at its link immediately; it appears in the directory once reviewed.',
          'Talk to it yourself, then adjust the notes where its answers miss.',
        ],
      },
      {
        heading: 'Share it where people already ask',
        paragraphs: [
          'An avatar nobody finds answers nobody. Put the link in your social bios, your email signature and your website, and reply to repeated questions with it. Then read the conversations: they tell you which notes need more detail, and which people need you in person.',
        ],
      },
      {
        heading: 'Be honest that it is an AI',
        paragraphs: [
          'People should know when they are talking to an AI, and some places require it. On meAsAgent an avatar always says it is an AI when asked, and it can only be of the person who launches it or of something they run — never of someone else.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I make an AI chatbot of myself for free?',
        answer: `Yes. ${PRODUCT_NAME} lets you launch one without paying. ${PRODUCT_PRICING_NOTE} Other tools have free tiers too; check their pricing pages for the limits.`,
      },
      {
        question: 'Is an AI clone the same as a digital twin?',
        answer:
          'People use the terms interchangeably for an AI that answers as a person. “Digital twin” also means a simulation of a machine or a building in engineering, which is unrelated.',
      },
      {
        question: 'How long does it take to make an AI version of yourself?',
        answer:
          'On a hosted tool, as long as it takes to write a bio and a few short notes — usually minutes. Tools that train on your existing work take longer to set up.',
      },
      {
        question: 'Will it sound like me?',
        answer:
          'Its wording follows what you write about how you talk. Whether it speaks in your actual voice depends on the tool; meAsAgent uses one shared synthetic voice.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How meAsAgent works' },
      { href: '/compare/delphi', label: 'meAsAgent compared with Delphi' },
      { href: '/for/founders', label: 'For founders' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    publishedAt: '2026-09-16',
    updatedAt: '2026-09-16',
  },
};

export const GUIDE_SLUGS = Object.keys(GUIDES) as GuideSlug[];

export function isGuideSlug(slug: string): slug is GuideSlug {
  return Object.hasOwn(GUIDES, slug);
}
