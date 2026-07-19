import type { RemoteFile, Server, ServerGroup } from '@/types'

export const mockGroups: ServerGroup[] = [
  { id: 'g-prod', name: '生产环境' },
  { id: 'g-staging', name: '测试环境' },
  { id: 'g-personal', name: '个人服务器' },
]

export const mockServers: Server[] = [
  {
    id: 's-1',
    name: 'web-01',
    host: '10.0.1.11',
    port: 22,
    username: 'root',
    authType: 'key',
    keyPath: '~/.ssh/id_ed25519',
    groupId: 'g-prod',
    color: '#22c55e',
    lastConnected: '2 小时前',
  },
  {
    id: 's-2',
    name: 'web-02',
    host: '10.0.1.12',
    port: 22,
    username: 'root',
    authType: 'key',
    keyPath: '~/.ssh/id_ed25519',
    groupId: 'g-prod',
    color: '#22c55e',
    lastConnected: '昨天',
  },
  {
    id: 's-3',
    name: 'db-master',
    host: '10.0.1.20',
    port: 2222,
    username: 'admin',
    authType: 'password',
    groupId: 'g-prod',
    color: '#ef4444',
    lastConnected: '3 天前',
  },
  {
    id: 's-4',
    name: 'staging-app',
    host: 'staging.example.com',
    port: 22,
    username: 'deploy',
    authType: 'key',
    keyPath: '~/.ssh/staging.pem',
    groupId: 'g-staging',
    color: '#eab308',
  },
  {
    id: 's-5',
    name: 'home-nas',
    host: '192.168.1.100',
    port: 22,
    username: 'ecarry',
    authType: 'password',
    groupId: 'g-personal',
    color: '#6366f1',
    lastConnected: '刚刚',
  },
]

export const mockFiles: RemoteFile[] = [
  { name: '..', type: 'dir', size: 0, modified: '', permissions: 'drwxr-xr-x' },
  { name: 'app', type: 'dir', size: 4096, modified: '2024-06-01 10:22', permissions: 'drwxr-xr-x' },
  { name: 'logs', type: 'dir', size: 4096, modified: '2024-06-12 08:15', permissions: 'drwxr-xr-x' },
  { name: 'config', type: 'dir', size: 4096, modified: '2024-05-28 17:40', permissions: 'drwxr-xr-x' },
  { name: 'docker-compose.yml', type: 'file', size: 2048, modified: '2024-06-10 14:03', permissions: '-rw-r--r--' },
  { name: '.env', type: 'file', size: 512, modified: '2024-06-10 14:00', permissions: '-rw-------' },
  { name: 'deploy.sh', type: 'file', size: 1536, modified: '2024-06-09 09:31', permissions: '-rwxr-xr-x' },
  { name: 'backup.tar.gz', type: 'file', size: 194887680, modified: '2024-06-13 02:00', permissions: '-rw-r--r--' },
  { name: 'README.md', type: 'file', size: 3072, modified: '2024-06-01 11:00', permissions: '-rw-r--r--' },
]
