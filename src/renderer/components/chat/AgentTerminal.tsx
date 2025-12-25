import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TerminalSearchBar,
  type TerminalSearchBarRef,
} from '@/components/terminal/TerminalSearchBar';
import { useXterm } from '@/hooks/useXterm';

interface AgentTerminalProps {
  cwd?: string;
  sessionId?: string;
  agentCommand?: string;
  environment?: 'native' | 'wsl';
  initialized?: boolean;
  isActive?: boolean;
  onInitialized?: () => void;
  onExit?: () => void;
}

const MIN_RUNTIME_FOR_AUTO_CLOSE = 10000; // 10 seconds

export function AgentTerminal({
  cwd,
  sessionId,
  agentCommand = 'claude',
  environment = 'native',
  initialized,
  isActive = false,
  onInitialized,
  onExit,
}: AgentTerminalProps) {
  const outputBufferRef = useRef('');
  const startTimeRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  // Build command with session args
  const command = useMemo(() => {
    const supportsSession = agentCommand === 'claude';
    const agentArgs =
      supportsSession && sessionId
        ? initialized
          ? ['--resume', sessionId]
          : ['--session-id', sessionId]
        : [];
    const fullCommand = `${agentCommand} ${agentArgs.join(' ')}`.trim();

    const isWindows = window.electronAPI?.env?.platform === 'win32';

    // WSL environment: run through WSL with interactive login shell
    if (environment === 'wsl' && isWindows) {
      // Use $SHELL -ilc to load nvm/rbenv, add explicit exit to ensure shell exits
      const wslCommand = `exec $SHELL -ilc "${fullCommand}; exit \\$?"`;
      return {
        shell: 'wsl.exe',
        args: ['--', 'sh', '-c', wslCommand],
      };
    }

    // Native Windows - use cmd /c to ensure exit after command completion
    if (isWindows) {
      return {
        shell: 'cmd.exe',
        args: ['/c', fullCommand],
      };
    }

    // Native Unix
    return {
      shell: '/bin/zsh',
      args: ['-i', '-l', '-c', fullCommand],
    };
  }, [agentCommand, sessionId, initialized, environment]);

  // Handle exit with auto-close logic
  const handleExit = useCallback(() => {
    const runtime = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const isSessionNotFound = outputBufferRef.current.includes(
      'No conversation found with session ID'
    );

    if (runtime >= MIN_RUNTIME_FOR_AUTO_CLOSE || isSessionNotFound) {
      onExit?.();
    }
    // Quick exit without session error - keep tab open for debugging
  }, [onExit]);

  // Track output for error detection
  const handleData = useCallback(
    (data: string) => {
      // Start timer on first data
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }

      // Mark as initialized on first data
      if (!hasInitializedRef.current && !initialized) {
        hasInitializedRef.current = true;
        onInitialized?.();
      }

      // Buffer output for error detection
      outputBufferRef.current += data;
      if (outputBufferRef.current.length > 1000) {
        outputBufferRef.current = outputBufferRef.current.slice(-500);
      }
    },
    [initialized, onInitialized]
  );

  // Handle Shift+Enter for newline (Ctrl+J / LF for all agents)
  const handleCustomKey = useCallback((event: KeyboardEvent, ptyId: string) => {
    if (event.key === 'Enter' && event.shiftKey) {
      if (event.type === 'keydown') {
        window.electronAPI.terminal.write(ptyId, '\x0a');
      }
      return false;
    }
    return true;
  }, []);

  const {
    containerRef,
    isLoading,
    settings,
    findNext,
    findPrevious,
    clearSearch,
    terminal,
    clear,
  } = useXterm({
    cwd,
    command,
    isActive,
    onExit: handleExit,
    onData: handleData,
    onCustomKey: handleCustomKey,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchBarRef = useRef<TerminalSearchBarRef>(null);

  // Handle Cmd+F / Ctrl+F
  const handleSearchKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        if (isSearchOpen) {
          searchBarRef.current?.focus();
        } else {
          setIsSearchOpen(true);
        }
      }
    },
    [isSearchOpen]
  );

  // Handle right-click context menu
  const handleContextMenu = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();

      const selectedId = await window.electronAPI.contextMenu.show([
        { id: 'clear', label: '清除终端' },
        { id: 'separator-1', label: '', type: 'separator' },
        { id: 'copy', label: '复制', disabled: !terminal?.hasSelection() },
        { id: 'paste', label: '粘贴' },
        { id: 'selectAll', label: '全选' },
      ]);

      if (!selectedId) return;

      switch (selectedId) {
        case 'clear':
          clear();
          break;
        case 'copy':
          if (terminal?.hasSelection()) {
            const selection = terminal.getSelection();
            navigator.clipboard.writeText(selection);
          }
          break;
        case 'paste':
          navigator.clipboard.readText().then((text) => {
            terminal?.paste(text);
          });
          break;
        case 'selectAll':
          terminal?.selectAll();
          break;
      }
    },
    [terminal, clear]
  );

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('keydown', handleSearchKeyDown);
    return () => window.removeEventListener('keydown', handleSearchKeyDown);
  }, [isActive, handleSearchKeyDown]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) return;

    container.addEventListener('contextmenu', handleContextMenu);
    return () => container.removeEventListener('contextmenu', handleContextMenu);
  }, [isActive, handleContextMenu, containerRef]);

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: settings.theme.background }}>
      <div ref={containerRef} className="h-full w-full px-[5px] py-[2px]" />
      <TerminalSearchBar
        ref={searchBarRef}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onFindNext={findNext}
        onFindPrevious={findPrevious}
        onClearSearch={clearSearch}
        theme={settings.theme}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ color: settings.theme.foreground, opacity: 0.5 }}
            />
            <span style={{ color: settings.theme.foreground, opacity: 0.5 }} className="text-sm">
              Loading {agentCommand}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
