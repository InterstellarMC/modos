import { useEffect } from 'react';
import {
  initApp,
  setPaletteOpen,
  useKeyboardShortcuts,
  useStore,
} from './state/store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toasts } from './components/Toasts';
import { CommandPalette } from './components/CommandPalette';
import { OverviewView } from './views/OverviewView';
import { QueueView } from './views/QueueView';
import { RaidView } from './views/RaidView';
import { RulesView } from './views/RulesView';
import { MemoryView } from './views/MemoryView';

export const App = () => {
  const view = useStore((s) => s.view);
  const loading = useStore((s) => s.loading);
  useKeyboardShortcuts();

  useEffect(() => {
    void initApp();
  }, []);

  return (
    <div className="min-h-screen gradient-bg flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden fade-in">
          {loading ? <Loading /> : <Router view={view} />}
        </main>
      </div>
      <CommandPalette />
      <Toasts />
      <CommandHint />
    </div>
  );
};

const Router = ({ view }: { view: string }) => {
  if (view === 'overview') return <OverviewView />;
  if (view === 'queue') return <QueueView />;
  if (view === 'raid') return <RaidView />;
  if (view === 'rules') return <RulesView />;
  if (view === 'memory') return <MemoryView />;
  return <OverviewView />;
};

const Loading = () => (
  <div className="route-shell flex min-h-[50vh] flex-1 flex-col items-center justify-center py-16">
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto mb-5 grid size-11 place-items-center rounded-[var(--radius-lg)] border border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)]">
        <div className="size-6 rounded-md bg-gradient-to-br from-modos-accent to-orange-800/90" />
      </div>
      <div className="t-h3 text-modos-text">Loading console</div>
      <p className="t-body mt-2 text-modos-muted">
        Hydrating deterministic models, queue, and playground incident data.
      </p>
      <div className="loader-bar mx-auto mt-6 max-w-[240px]" aria-hidden />
    </div>
  </div>
);

const CommandHint = () => {
  const palette = useStore((s) => s.paletteOpen);
  if (palette) return null;
  return (
    <button
      onClick={() => setPaletteOpen(true)}
      className="motion-default fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-[var(--radius-md)] border border-modos-border bg-modos-panel/90 px-3 py-1.5 text-[11.5px] text-modos-muted shadow-[var(--shadow-float)] backdrop-blur-md hover:border-modos-border-strong hover:text-modos-text sm:bottom-8"
    >
      <span className="kbd">⌘ K</span>
      Open command palette
    </button>
  );
};
