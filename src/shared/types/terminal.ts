export interface TerminalSession {
  id: string;
  title: string;
  cwd: string;
  shell: string;
  cols: number;
  rows: number;
}

export interface TerminalCreateOptions {
  cwd?: string;
  shell?: string;
  args?: string[];
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
  shellConfig?: import('./shell').ShellConfig;
}

export interface TerminalResizeOptions {
  cols: number;
  rows: number;
}
