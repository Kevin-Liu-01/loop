export type ProcessInfo = {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
  command: string;
};

export type MemoryInfo = {
  totalMb: number;
  usedMb: number;
  freeMb: number;
};

export type DiskInfo = {
  totalMb: number;
  usedMb: number;
  freeMb: number;
};

export type FileEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: string;
};

export type PackageInfo = {
  name: string;
  version: string;
};

export type SandboxInspectResponse = {
  sandboxId: string;
  uptimeSeconds: number;
  timeoutMs: number;
  runtimeVersion: string;
  memory: MemoryInfo;
  disk: DiskInfo;
  processes: ProcessInfo[];
  files: FileEntry[];
  packages: PackageInfo[];
};

export type SandboxInspectRequest = {
  sandboxId: string;
  path?: string;
};
