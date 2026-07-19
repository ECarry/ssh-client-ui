import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { MainPanel } from '@/components/MainPanel'
import { ServerFormModal } from '@/components/ServerFormModal'
import { mockFiles, mockGroups, mockServers } from '@/data/mock'
import type { Server } from '@/types'

function App() {
  const [servers, setServers] = useState<Server[]>(mockServers)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)

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
        groups={mockGroups}
        servers={servers}
        activeServerId={activeId}
        onSelect={selectServer}
        onAddServer={openAdd}
        onEditServer={openEdit}
      />

      <main className="min-w-0 flex-1">
        <MainPanel
          server={activeServer}
          files={mockFiles}
          onEdit={() => activeServer && openEdit(activeServer)}
        />
      </main>

      <ServerFormModal
        open={modalOpen}
        groups={mockGroups}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={saveServer}
      />
    </div>
  )
}

export default App
