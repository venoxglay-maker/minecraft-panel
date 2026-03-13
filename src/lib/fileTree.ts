/** Mock file tree for a Minecraft server – in production load from API */

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
};

const defaultContent = `#Minecraft server properties
#Tue Aug 12 03:46:59 UTC 2025
spawn-protection=16
max-tick-time=60000
difficulty=3
max-players=20
server-port=25565
level-name=world
online-mode=true
motd=POWERED BY THE DISCO
`;

const eulaContent = `#By changing the setting below to TRUE you are indicating your agreement to our EULA.
#Fri Aug 12 00:00:00 UTC 2025
eula=true
`;

export function getMockFileTree(): FileNode[] {
  return [
    {
      name: 'config',
      path: 'config',
      type: 'folder',
      children: [
        { name: 'defaultconfigs', path: 'config/defaultconfigs', type: 'folder', children: [] },
        { name: 'example.cfg', path: 'config/example.cfg', type: 'file', content: '# config\nkey=value\n' },
      ],
    },
    {
      name: 'mods',
      path: 'mods',
      type: 'folder',
      children: [],
    },
    {
      name: 'world',
      path: 'world',
      type: 'folder',
      children: [],
    },
    {
      name: 'server.properties',
      path: 'server.properties',
      type: 'file',
      content: defaultContent,
    },
    {
      name: 'eula.txt',
      path: 'eula.txt',
      type: 'file',
      content: eulaContent,
    },
    {
      name: 'ops.json',
      path: 'ops.json',
      type: 'file',
      content: '[]',
    },
  ];
}

export function findFileInTree(nodes: FileNode[], path: string): FileNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.children) {
      const found = findFileInTree(n.children, path);
      if (found) return found;
    }
  }
  return null;
}
