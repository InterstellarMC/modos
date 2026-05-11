import { useToasts } from '../state/store';
import { cn } from '../lib/cn';
import { IconCheck, IconAlert, IconBolt } from '../lib/icons';

export const Toasts = () => {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon =
          t.tone === 'ok' ? IconCheck : t.tone === 'warn' ? IconAlert : IconBolt;
        const color =
          t.tone === 'ok'
            ? 'text-modos-ok'
            : t.tone === 'warn'
              ? 'text-modos-warn'
              : 'text-modos-info';
        return (
          <div
            key={t.id}
            className={cn(
              'fade-in pointer-events-auto flex items-center gap-2.5 rounded-xl border border-modos-border bg-modos-panel px-3.5 py-2.5 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.7)]'
            )}
          >
            <Icon className={color} />
            <span className="text-[13px]">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
};
