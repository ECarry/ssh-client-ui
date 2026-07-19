import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Folder,
  Plus,
  Search,
  Server as ServerIcon,
  Terminal,
} from 'lucide-react'
import type { Server, ServerGroup } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  groups: ServerGroup[]
  servers: Server[]
  activeServerId?: string
  onSelect: (server: Server) => void
  onAddServer: () => void
  onEditServer: (server: Server) => void
}

export function Sidebar({
  groups,
  servers,
  activeServerId,
  onSelect,
  onAddServer,
  onEditServer,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return servers
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.host.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q),
    )
  }, [servers, query])

  const toggle = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  return (
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Terminal className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Ferric SSH</div>
          <div className="text-xs text-muted-foreground">Rust · Tauri Client</div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索服务器..."
            className="pl-8"
          />
        </div>
      </div>

      {/* Groups + servers */}
      <div className="flex-1 overflow-y-auto px-2">
        {groups.map((group) => {
          const groupServers = filtered.filter((s) => s.groupId === group.id)
          if (groupServers.length === 0) return null
          const isCollapsed = collapsed[group.id]
          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggle(group.id)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                <Folder className="h-3.5 w-3.5" />
                <span className="uppercase tracking-wide">{group.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {groupServers.length}
                </Badge>
              </button>

              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {groupServers.map((server) => (
                    <ServerRow
                      key={server.id}
                      server={server}
                      active={server.id === activeServerId}
                      onClick={() => onSelect(server)}
                      onDoubleClick={() => onEditServer(server)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add button */}
      <div className="border-t border-sidebar-border p-3">
        <Button onClick={onAddServer} className="w-full">
          <Plus className="h-4 w-4" />
          添加服务器
        </Button>
      </div>
    </aside>
  )
}

function ServerRow({
  server,
  active,
  onClick,
  onDoubleClick,
}: {
  server: Server
  active: boolean
  onClick: () => void
  onDoubleClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title="单击选择 · 双击编辑"
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-2 pl-7 text-left transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'hover:bg-sidebar-accent/60',
      )}
    >
      <ServerIcon
        className="h-4 w-4 shrink-0"
        style={{ color: server.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{server.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {server.username}@{server.host}
        </div>
      </div>
      {server.lastConnected && (
        <Circle className="h-2 w-2 shrink-0 fill-green-500 text-green-500 opacity-0 group-hover:opacity-100" />
      )}
    </button>
  )
}
