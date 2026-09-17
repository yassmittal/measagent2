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
    lede: 'An AI version of yourself is a chatbot that answers as you. People also call it an AI clone, a digital twin or an AI avatar. To make one, decide who it’s for, write down what it should know and how you talk, pick a tool that turns those notes into a chat, and share the link where people already try to reach you.',
    sections: [
      {
        heading: 'First, decide what kind you need',
        paragraphs: [
          '“AI clone” can mean three different things, and the tools for each are very different.',
        ],
        bulletPoints: [
          'A video clone makes videos of your face reading a script. You can’t talk to it.',
          'A voice clone reads text out loud in your voice.',
          'A chat clone answers questions as you, by text and often by voice. This guide is about this one.',
        ],
      },
      {
        heading: 'Decide who it answers, and what for',
        paragraphs: [
          'Write down the three or four questions people ask you most, and who asks them. A founder answering investors needs different notes from a teacher answering students. Either way, an AI that knows a few things well beats one that knows a little about everything.',
        ],
      },
      {
        heading: 'Write what it should know',
        paragraphs: [
          'Whatever tool you use, the answers are only as good as what you give it. Four short pieces of writing go a long way:',
        ],
        bulletPoints: [
          'A public bio: one or two lines that tell people who they’re talking to.',
          'About you: your work, what you’re building, what you believe, and the answers you give most often.',
          'How you talk: short or detailed, formal or casual, words you use and words you never would.',
          'Topics to avoid: private stuff, numbers you don’t share, and anything that needs you in person.',
        ],
      },
      {
        heading: 'Pick how to build it',
        paragraphs: [
          'There are three main ways. Prices and features change often, so check each tool’s own site before you pick.',
        ],
        bulletPoints: [
          `A ready-made avatar you launch in minutes, like ${PRODUCT_NAME}. Sign in, write the notes above, and share the link. People talk by text or voice, it remembers people who sign in, and you read every chat. It doesn’t learn from uploaded documents. ${PRODUCT_PRICING_NOTE}`,
          'A tool trained on your existing work, like Delphi. You connect your writing, talks or podcasts so answers come from them. More material and integrations usually cost more.',
          'A custom GPT or something you build yourself. Easy and cheap to start, but sharing, memory and reading chats are up to you.',
        ],
      },
      {
        heading: 'Launch it on meAsAgent, step by step',
        paragraphs: ['If you go with meAsAgent, this is the whole process.'],
        steps: [
          'Open the launch page and sign in with Google. The avatar’s name and photo come from that account.',
          'Choose whether the avatar is you or something you run, like a product or a company.',
          'Pick a handle. It becomes your link and can’t change.',
          'Write the bio and the three notes. Add a few “Ask me about” topics and your website if you want them on the page.',
          'Confirm and launch. Your avatar goes live at its link and on the front page right away.',
          'Talk to it yourself, then fix the notes wherever its answers are off.',
        ],
      },
      {
        heading: 'Share it where people already ask',
        paragraphs: [
          'If nobody finds your avatar, nobody talks to it. Put the link in your social bios, your email signature and your website, and send it when people ask the same question again. Then read the chats. They show you which notes need more detail, and who needs you in person.',
        ],
      },
      {
        heading: 'Be honest that it is an AI',
        paragraphs: [
          'People should know when they’re talking to an AI, and some places require it by law. On meAsAgent an avatar always says it’s an AI when asked. It can only be the person who launched it or something they run, never someone else.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can I make an AI chatbot of myself for free?',
        answer: `Yes. ${PRODUCT_NAME} lets you launch one without paying. ${PRODUCT_PRICING_NOTE} Other tools have free plans too. Check their pricing pages for the limits.`,
      },
      {
        question: 'Is an AI clone the same as a digital twin?',
        answer:
          'People use both for an AI that answers as a person. In engineering, “digital twin” also means a computer model of a machine or a building, which is something else.',
      },
      {
        question: 'How long does it take to make an AI version of yourself?',
        answer:
          'With a ready-made tool, about as long as it takes to write a bio and a few short notes. Usually a few minutes. Tools that train on your existing work take longer.',
      },
      {
        question: 'Will it sound like me?',
        answer:
          'Its words follow what you write about how you talk. Whether it uses your real voice depends on the tool. meAsAgent uses one computer voice for everyone.',
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How meAsAgent works' },
      { href: '/compare/delphi', label: 'meAsAgent compared with Delphi' },
      { href: '/for/founders', label: 'For founders' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    publishedAt: '2026-09-16',
    updatedAt: '2026-09-17',
  },
};

export const GUIDE_SLUGS = Object.keys(GUIDES) as GuideSlug[];

export function isGuideSlug(slug: string): slug is GuideSlug {
  return Object.hasOwn(GUIDES, slug);
}
