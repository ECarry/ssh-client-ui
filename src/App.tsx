import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { MainPanel } from '@/components/MainPanel'
import { ServerFormModal } from '@/components/ServerFormModal'
import { loadConfig, saveConfig } from '@/lib/store'
import type { Server, ServerGroup } from '@/types'

function App() {
  const [servers, setServers] = useState<Server[]>([])
  const [groups, setGroups] = useState<ServerGroup[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)

  // Load persisted config on startup.
  useEffect(() => {
    loadConfig()
      .then((cfg) => {
        setServers(cfg.servers)
        setGroups(cfg.groups)
      })
      .catch((err) => console.error('加载配置失败', err))
      .finally(() => setLoaded(true))
  }, [])

  // Persist whenever servers or groups change (after the initial load).
  const skipSave = useRef(true)
  useEffect(() => {
    if (!loaded) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveConfig({ servers, groups }).catch((err) =>
      console.error('保存配置失败', err),
    )
  }, [servers, groups, loaded])

  const activeServer = useMemo(
    () => servers.find((s) => s.id === activeId),
    [servers, activeId],
  )

  const selectServer = (server: Server) => {
    setActiveId(server.id)
  }

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (server: Server) => {
    setEditing(server)
    setModalOpen(true)
  }

  const saveServer = (server: Server) => {
    setServers((prev) => {
      const exists = prev.some((s) => s.id === server.id)
      return exists
        ? prev.map((s) => (s.id === server.id ? server : s))
        : [...prev, server]
    })
    setActiveId(server.id)
    setModalOpen(false)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        groups={groups}
        servers={servers}
        activeServerId={activeId}
        onSelect={selectServer}
        onAddServer={openAdd}
        onEditServer={openEdit}
      />

      <main className="min-w-0 flex-1">
        <MainPanel
          server={activeServer}
          onEdit={() => activeServer && openEdit(activeServer)}
        />
      </main>

      <ServerFormModal
        open={modalOpen}
        groups={groups}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={saveServer}
      />
    </div>
  )
}

export default App
