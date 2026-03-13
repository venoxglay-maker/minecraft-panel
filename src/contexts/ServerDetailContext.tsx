'use client';

import { createContext, useContext } from 'react';
import type { ServerItem } from '@/lib/servers';

type ServerWithMeta = ServerItem & { description?: string; created?: string; lastStarted?: string };

const ServerDetailContext = createContext<{ server: ServerWithMeta | null }>({ server: null });

export function useServerDetail() {
  return useContext(ServerDetailContext);
}

export const ServerDetailProvider = ServerDetailContext.Provider;
