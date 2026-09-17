'use client';

import { ExternalLink } from 'lucide-react';
import { useConversation } from '@/state/ConversationProvider';

/**
 * What the owner chose to add under the bio. Renders nothing for an avatar
 * without topics or a website, so most panels look exactly as they did.
 */
export function AvatarProfileDetails() {
  const { avatar } = useConversation();
  const hasTopics = avatar.askMeAbout.length > 0;
  if (!hasTopics && avatar.websiteUrl === null) return null;

  return (
    <div className="avatar-profile-details">
      {hasTopics ? (
        <>
          <h2 className="avatar-profile-topics-heading">Ask me about</h2>
          <ul className="avatar-profile-topics">
            {avatar.askMeAbout.map((topic) => (
              <li key={topic} className="avatar-profile-topic">
                {topic}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {avatar.websiteUrl !== null ? (
        <a
          href={avatar.websiteUrl}
          className="avatar-profile-website"
          // `me` ties the page to the owner's own site. Nobody checks the link
          // before it goes live, so it passes no ranking credit.
          rel="me nofollow ugc noopener"
          target="_blank"
        >
          {new URL(avatar.websiteUrl).host}
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
