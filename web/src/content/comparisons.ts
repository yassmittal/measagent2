import { PRODUCT_NAME, PRODUCT_PRICING_NOTE } from '@/lib/product';
import type { ArticleCopy } from './content-types';

export type ComparisonSlug = 'delphi';

/** One claim about another product, with where it was read and when. */
export interface SourcedClaim {
  text: string;
  sourceUrl: string;
  checkedOn: string;
}

export interface ComparisonRow {
  feature: string;
  ours: string;
  theirs: SourcedClaim;
}

export interface ComparisonCopy extends ArticleCopy {
  competitorName: string;
  rows: ComparisonRow[];
}

const DELPHI_HOME_URL = 'https://www.delphi.ai/';
const DELPHI_PRICING_URL = 'https://www.delphi.ai/pricing';

/**
 * Only what Delphi's own pages say, on the day they were read. Their pricing
 * page served more than one version on 2026-09-16; a claim appears here only if
 * every version made it, or it is quoted from the home page. Re-read both
 * sources and move `checkedOn` before changing a row.
 */
const DELPHI_CHECKED_ON = '2026-09-16';

export const COMPARISONS: Record<ComparisonSlug, ComparisonCopy> = {
  delphi: {
    path: '/compare/delphi',
    competitorName: 'Delphi',
    metaTitle: 'meAsAgent vs Delphi: an honest comparison',
    metaDescription:
      'meAsAgent and Delphi both make an AI version of you. What each one does, what it costs, and which fits you. Every Delphi claim is sourced and dated.',
    eyebrow: 'Compare',
    heading: 'meAsAgent vs Delphi',
    lede: `Delphi and ${PRODUCT_NAME} both give you an AI that answers people as you. Delphi builds a “Digital Mind” from things you’ve already made, like writing, talks and frameworks, with paid plans for more material and integrations. ${PRODUCT_NAME} answers from a few notes you write, remembers people who sign in, and lets you read every chat. If your answers live in a lot of existing work, Delphi fits better. If you want something running in minutes and want to see what people asked, ${PRODUCT_NAME} fits better.`,
    sections: [
      {
        heading: 'Choose Delphi if',
        paragraphs: [],
        bulletPoints: [
          'Your knowledge is already written or recorded, and you want answers to come from it.',
          'You need integrations or want it on other sites. Delphi lists Slack and embedding on its paid plans.',
          'You want answers “at any hour, in your voice”, as Delphi’s home page puts it.',
        ],
      },
      {
        heading: `Choose ${PRODUCT_NAME} if`,
        paragraphs: [],
        bulletPoints: [
          'You’d rather write a few notes than collect material to train on.',
          'You want to read every chat and get a weekly email about who wants to hear from you.',
          'You want people who come back to be remembered.',
          `You want it free while ${PRODUCT_NAME} is in early access.`,
        ],
      },
      {
        heading: 'How this comparison was made',
        paragraphs: [
          `Every claim about Delphi links to the page it came from, with the date. Claims about ${PRODUCT_NAME} describe it as of the date at the top of this page. Delphi changes its plans and pages. If something here is out of date, email the address in the privacy notice and we’ll fix it.`,
        ],
      },
    ],
    rows: [
      {
        feature: 'What it answers from',
        ours: 'A public bio and three notes you write: about you, how you talk, topics to avoid.',
        theirs: {
          text: '“Turn your writing, talks, and frameworks into a digital mind.” You connect work you’ve made.',
          sourceUrl: DELPHI_HOME_URL,
          checkedOn: DELPHI_CHECKED_ON,
        },
      },
      {
        feature: 'Voice',
        ours: 'People can speak and hear replies out loud, in one computer voice shared by every avatar.',
        theirs: {
          text: '“Voice Calling + Chat” is listed on every plan, from Free up.',
          sourceUrl: DELPHI_PRICING_URL,
          checkedOn: DELPHI_CHECKED_ON,
        },
      },
      {
        feature: 'Seeing what people asked',
        ours: 'You read every chat, and a weekly email points out who asked for you directly.',
        theirs: {
          text: 'The home page says it “reveals rising trends, hidden signals, and the exact moments worth acting on”.',
          sourceUrl: DELPHI_HOME_URL,
          checkedOn: DELPHI_CHECKED_ON,
        },
      },
      {
        feature: 'Remembering people who come back',
        ours: 'Yes, for people who sign in and accept the terms. They can make it forget.',
        theirs: {
          text: 'Not stated on the home or pricing page.',
          sourceUrl: DELPHI_PRICING_URL,
          checkedOn: DELPHI_CHECKED_ON,
        },
      },
      {
        feature: 'Where it lives',
        ours: 'A page at its own link. No embedding or integrations yet.',
        theirs: {
          text: 'Slack and embedding on paid plans. SMS, WhatsApp and API access on the top plan.',
          sourceUrl: DELPHI_PRICING_URL,
          checkedOn: DELPHI_CHECKED_ON,
        },
      },
      {
        feature: 'Price',
        ours: PRODUCT_PRICING_NOTE,
        theirs: {
          text: 'Free ($0/month), Builder ($79/month), Scaler ($299/month), Immortal (custom pricing).',
          sourceUrl: DELPHI_PRICING_URL,
          checkedOn: DELPHI_CHECKED_ON,
        },
      },
    ],
    faq: [
      {
        question: 'Is meAsAgent a Delphi alternative?',
        answer:
          'For an AI of yourself that people can chat with, yes. It does less: no training on your existing work, no voice cloning, no integrations. In return it takes minutes to launch, shows you every chat, and is free while in early access.',
      },
      {
        question: 'Does Delphi have a free plan?',
        answer: `Its pricing page listed a Free plan at $0 per month when checked on ${DELPHI_CHECKED_ON}.`,
      },
    ],
    related: [
      { href: '/how-it-works', label: 'How meAsAgent works' },
      {
        href: '/guides/make-an-ai-version-of-yourself',
        label: 'How to make an AI version of yourself',
      },
      { href: '/launch', label: 'Launch your avatar' },
    ],
    publishedAt: '2026-09-16',
    updatedAt: '2026-09-17',
  },
};

export const COMPARISON_SLUGS = Object.keys(COMPARISONS) as ComparisonSlug[];

export function isComparisonSlug(slug: string): slug is ComparisonSlug {
  return Object.hasOwn(COMPARISONS, slug);
}
