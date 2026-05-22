import { CINEMATIC_STEP_COUNT, stopCinematic, useStore } from '../state/store';
import { cn } from '../lib/cn';

export const CinematicOverlay = () => {
  const active = useStore((s) => s.cinematicActive);
  const step = useStore((s) => s.cinematicStep);
  const subtitle = useStore((s) => s.cinematicSubtitle);

  if (!active) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-2xl px-6 pb-8 pointer-events-auto">
        <div className="glass rounded-xl px-6 py-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: CINEMATIC_STEP_COUNT }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-1.5 rounded-full transition-all duration-300',
                    i === step
                      ? 'bg-modos-accent w-4'
                      : i < step
                        ? 'bg-modos-accent/40'
                        : 'bg-modos-border'
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => stopCinematic()}
              className="text-[11px] text-modos-muted hover:text-modos-text transition px-2 py-0.5 rounded-md hover:bg-modos-panel"
            >
              Skip
            </button>
          </div>
          {subtitle && (
            <p className="text-[14px] text-modos-text leading-snug font-medium fade-in">
              {subtitle}
            </p>
          )}
          <div className="mt-2 h-0.5 rounded-full bg-modos-border overflow-hidden">
            <div
              className="h-full bg-modos-accent rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((step + 1) / CINEMATIC_STEP_COUNT) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
