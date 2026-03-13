export type ServerStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'installing';

export interface ServerItem {
  name: string;
  slug: string;
  version: string;
  players: string;
  playersOnline: number;
  playersMax: number;
  tps: string;
  status: ServerStatus;
}

export function getStatusLabel(status: ServerStatus): string {
  switch (status) {
    case 'running': return 'Running';
    case 'stopping': return 'Wird gestoppt';
    case 'stopped': return 'Gestoppt';
    case 'starting': return 'Wird gestartet';
    case 'installing': return 'Wird installiert';
    default: return status;
  }
}

export function getStatusColor(status: ServerStatus): string {
  switch (status) {
    case 'running': return 'text-panel-green';
    case 'stopping':
    case 'starting': return 'text-amber-400';
    case 'stopped':
    case 'installing': return 'text-panel-red';
    default: return 'text-panel-muted';
  }
}
