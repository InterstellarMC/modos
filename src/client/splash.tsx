import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { context, requestExpandedMode } from '@devvit/web/client';

export const Splash = () => {
  return (
    <div className="relative min-h-screen w-full gradient-bg overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(900px 360px at 20% 0%, rgba(255,69,0,0.25), transparent), radial-gradient(600px 240px at 110% 100%, rgba(106,165,255,0.18), transparent)',
        }}
      />
      <div className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 py-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-modos-accent to-orange-700 grid place-items-center shadow-[0_0_30px_-6px_rgba(255,69,0,0.7)]">
            <div className="size-3 rounded-sm bg-white/95" />
          </div>
          <div className="text-left">
            <div className="text-[18px] font-semibold tracking-tight leading-none">
              MODOS
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-modos-subtle leading-none mt-1">
              Moderation OS
            </div>
          </div>
        </div>

        <h1 className="text-[24px] sm:text-[30px] font-semibold tracking-tight max-w-2xl leading-tight">
          The AI-native operating system for Reddit moderation.
        </h1>
        <p className="text-[13.5px] sm:text-[14px] text-modos-muted max-w-md mt-3 leading-snug">
          Triage smarter, draft removals in one click, and stop coordinated
          raids before they escalate. Built on Devvit · runs inline.
        </p>

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'console')}
            className="px-4 py-2 rounded-lg bg-modos-accent text-white text-[13.5px] font-medium hover:bg-orange-500 transition shadow-[0_10px_30px_-12px_rgba(255,69,0,0.8)]"
          >
            Open the MODOS console
          </button>
          <span className="text-[11.5px] text-modos-muted">
            hey u/{context.username ?? 'mod'} — your queue is waiting.
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl w-full">
          <Pill icon="🛡" title="AI Triage Queue" body="Risk-scored items with evidence-grade reasoning." />
          <Pill icon="📡" title="Raid Radar" body="Detect coordinated brigades within 90 seconds." />
          <Pill icon="🧠" title="Mod Memory" body="A shared brain across your entire mod team." />
        </div>
      </div>
    </div>
  );
};

const Pill = ({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) => (
  <div className="panel p-3.5 text-left">
    <div className="flex items-center gap-2">
      <span className="text-[15px]">{icon}</span>
      <h3 className="text-[13px] font-medium">{title}</h3>
    </div>
    <p className="text-[11.5px] text-modos-muted mt-1.5 leading-snug">{body}</p>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
