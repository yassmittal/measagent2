const WAVEFORM_BARS = ['first', 'second', 'third', 'fourth', 'fifth'] as const;

export function ListeningWaveform({ active }: { active: boolean }) {
  return (
    <span className={`wave${active ? ' on' : ''}`} aria-hidden="true">
      {WAVEFORM_BARS.map((bar) => (
        <i key={bar} />
      ))}
    </span>
  );
}
