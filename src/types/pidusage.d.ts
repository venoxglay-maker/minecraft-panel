declare module 'pidusage' {
  interface PidUsageResult {
    cpu: number;
    memory: number;
    ppid?: number;
    pid: number;
    ctime?: number;
    elapsed?: number;
    timestamp?: number;
  }
  function pidusage(pid: number, options?: Record<string, unknown>): Promise<PidUsageResult>;
  export default pidusage;
}
