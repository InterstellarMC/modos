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
        <main className="flex-1 min-h-0 fade-in">
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
  <div className="grid place-items-center h-full">
    <div className="text-center">
      <div className="size-10 rounded-xl bg-gradient-to-br from-modos-accent to-orange-700 grid place-items-center mx-auto mb-3 animate-pulse">
        <div className="size-3 rounded-sm bg-white/95" />
      </div>
      <div className="text-[13px] text-modos-muted">
        Initializing MODOS reasoning engine…
      </div>
    </div>
  </div>
);

const CommandHint = () => {
  const palette = useStore((s) => s.paletteOpen);
  if (palette) return null;
  return (
    <button
      onClick={() => setPaletteOpen(true)}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 text-[11.5px] text-modos-muted hover:text-modos-text px-3 py-1.5 panel-inset transition flex items-center gap-2 z-30"
    >
      <span className="kbd">⌘ K</span>
      Open command palette
    </button>
  );
};
