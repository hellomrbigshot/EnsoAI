export type WindowsShellType =
  | 'powershell7'
  | 'powershell'
  | 'cmd'
  | 'gitbash'
  | 'nushell'
  | 'wsl'
  | 'custom';
export type UnixShellType = 'system' | 'zsh' | 'bash' | 'fish' | 'nushell' | 'sh' | 'custom';

export interface ShellInfo {
  id: string;
  name: string;
  path: string;
  args: string[];
  available: boolean;
  isWsl?: boolean;
}

export interface ShellConfig {
  shellType: WindowsShellType | UnixShellType;
  customShellPath?: string;
  customShellArgs?: string[];
}
