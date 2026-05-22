import './index.css';

import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { context, requestExpandedMode } from '@devvit/web/client';

import { IconMemory, IconQueue, IconRadar } from './lib/icons';

export const Splash = () => {
  return (
    <div className="relative min-h-screen w-full gradient-bg overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          background:
            'radial-gradient(760px 320px at 18% -8%, rgba(255,69,0,0.18), transparent 58%), radial-gradient(520px 280px at 108% 12%, rgba(106,165,255,0.12), transparent 55%)',
        }}
      />

      <div className="route-shell relative flex min-h-screen flex-col items-center justify-center py-14 text-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-[var(--radius-lg)] border border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)]">
            <div className="size-8 rounded-[7px] bg-gradient-to-br from-modos-accent to-orange-900/90" />
          </div>
          <div className="text-left">
            <div className="text-[18px] font-semibold tracking-tight text-modos-text">
              MODOS
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-modos-subtle">
              Moderation OS
            </div>
          </div>
        </div>

        <h1 className="t-h1 max-w-[18ch] text-balance text-modos-text sm:max-w-3xl">
          The AI-native operations layer for Reddit moderation.
        </h1>
        <p className="t-body mx-auto mt-4 max-w-md text-modos-muted sm:max-w-lg">
          Triage with evidence-backed reasoning, ship removal language in seconds,
          and unwind coordinated raids before judges see the damage. Built on
          Devvit—runs immediately inside the thread.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'console')}
            className="motion-default motion-press rounded-[var(--radius-md)] bg-modos-accent px-6 py-3 text-[14px] font-semibold text-white shadow-[var(--shadow-panel)] hover:bg-orange-600"
          >
            Open console
          </button>
          <p className="text-[11.5px] text-modos-muted sm:max-w-[220px] sm:text-left">
            Signed in as u/{context.username ?? 'moderator'} — your queue renders
            the moment MODOS initializes.
          </p>
        </div>

        <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Feature
            icon={<IconQueue className="text-modos-accent" />}
            title="Signal-weighted queue"
            body="Every row ships with calibrated risk scores, causal signals, and a one-click remediation path."
          />
          <Feature
            icon={<IconRadar className="text-modos-info" />}
            title="Raid radar"
            body="Live velocity traces with mod playbooks—you stand up defenses before the brigade settles in."
          />
          <Feature
            icon={<IconMemory className="text-modos-warn" />}
            title="Moderator memory"
            body="A durable ledger travels with accounts so institutional knowledge survives shift changes."
          />
        </div>
      </div>
    </div>
  );
};

const Feature = ({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) => (
  <div className="motion-default rounded-[var(--radius-lg)] border border-modos-border bg-modos-panel/90 p-4 text-left shadow-[var(--shadow-panel)] sm:p-[18px]">
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev">
        {icon}
      </span>
      <h3 className="text-[13px] font-semibold leading-snug text-modos-text">
        {title}
      </h3>
    </div>
    <p className="mt-3 text-[11.5px] leading-relaxed text-modos-muted">{body}</p>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
