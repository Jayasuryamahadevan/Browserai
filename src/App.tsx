import { TitleBar } from './components/TitleBar';
import { BrowserView } from './components/BrowserView';
import { AISidePanel } from './components/AISidePanel';
import { NotesPanel } from './components/NotesPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { MemoryPanel } from './components/MemoryPanel';
import { TestingPanel } from './components/TestingPanel';
import { ContextMenu } from './components/ContextMenu';
import { DropZone } from './components/DropZone';
import { SettingsModal } from './components/SettingsModal';
import { useJessicaStore } from './store/useJessicaStore';
import { BookmarksSidebar } from './components/BookmarksSidebar';
import { useApplySettings } from './hooks/useApplySettings';
// import { initMcpBridge } from './lib/mcpBridge'; // Removed for stability

import { CalendarOverlay } from './components/CalendarOverlay';
import { MediaOverlay } from './components/MediaOverlay';
import { HoverSidebar } from './components/HoverSidebar';
// import { useEffect } from 'react'; // Removed - MCP disabled

function App() {
  const { tabLayout } = useJessicaStore();

  // Apply settings (theme, fonts, animations, etc.)
  useApplySettings();

  // MCP Bridge removed for stability
  // useEffect(() => {
  //   initMcpBridge();
  // }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden relative bg-[var(--bg-deep)]">
      {/* Unified Header */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Vertical Tabs Sidebar (Hover Mode) */}
        {tabLayout === 'vertical' && (
          <HoverSidebar />
        )}

        <BrowserView />
        <AISidePanel />
        <NotesPanel />
        <ProjectsPanel />
        <MemoryPanel />
        <TestingPanel />
        <DropZone />
      </div>
      <ContextMenu />
      <SettingsModal />
      <CalendarOverlay />
      <MediaOverlay />
      <BookmarksSidebar />
    </div>
  );
}

export default App;
