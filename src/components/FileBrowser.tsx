import { useState } from 'react'
import {
  ChevronRight,
  Download,
  File as FileIcon,
  FolderClosed,
  Home,
  RefreshCw,
  Upload,
} from 'lucide-react'
import type { RemoteFile } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileBrowserProps {
  files: RemoteFile[]
}

function formatSize(bytes: number) {
  if (bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function FileBrowser({ files }: FileBrowserProps) {
  const [path, setPath] = useState('/home/deploy')
  const [selected, setSelected] = useState<string | null>(null)

  const segments = path.split('/').filter(Boolean)

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Button variant="ghost" size="icon-sm">
          <Home className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto rounded-lg bg-muted px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">/</span>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="whitespace-nowrap">{seg}</span>
              {i < segments.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </span>
          ))}
        </div>
        <Button variant="ghost" size="icon-sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4" />
          上传
        </Button>
        <Button variant="outline" size="sm" disabled={!selected}>
          <Download className="h-4 w-4" />
          下载
        </Button>
      </div>

      {/* File table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-medium">名称</th>
              <th className="px-4 py-2 text-right font-medium">大小</th>
              <th className="px-4 py-2 text-left font-medium">修改时间</th>
              <th className="px-4 py-2 text-left font-medium">权限</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.name}
                onClick={() => setSelected(file.name)}
                onDoubleClick={() => {
                  if (file.type === 'dir' && file.name !== '..') {
                    setPath((p) => `${p}/${file.name}`)
                    setSelected(null)
                  } else if (file.name === '..') {
                    setPath((p) => p.split('/').slice(0, -1).join('/') || '/')
                  }
                }}
                className={cn(
                  'cursor-default border-b border-border/50 transition-colors',
                  selected === file.name ? 'bg-accent' : 'hover:bg-muted',
                )}
              >
                <td className="flex items-center gap-2 px-4 py-2">
                  {file.type === 'dir' ? (
                    <FolderClosed className="h-4 w-4 text-primary" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{file.name}</span>
                </td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {file.type === 'dir' ? '-' : formatSize(file.size)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {file.modified || '-'}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {file.permissions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {selected ? (
          <span>
            已选择: <span className="text-foreground">{selected}</span>
          </span>
        ) : (
          <span>提示: 双击文件夹进入 · 单击选中后可下载</span>
        )}
      </div>
    </div>
  )
}
