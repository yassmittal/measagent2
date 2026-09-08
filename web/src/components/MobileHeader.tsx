import { AVATAR_PORTRAIT_SRC, PERSONA_NAME } from '@/lib/persona';

export function MobileHeader() {
  return (
    <header className="mobile-header">
      {/* biome-ignore lint/performance/noImgElement: static SVG portrait — see Avatar.tsx */}
      <img className="mobile-header-avatar" src={AVATAR_PORTRAIT_SRC} alt="" />
      <div className="mobile-header-id">
        <span className="mobile-header-name">{PERSONA_NAME}</span>
      </div>
    </header>
  );
}
