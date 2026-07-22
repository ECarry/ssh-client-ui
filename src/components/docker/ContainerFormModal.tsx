import { useState, type FormEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CreateDockerContainerInput, DockerContainer } from '@/lib/docker'

interface ContainerFormModalProps {
  initial?: DockerContainer | null
  onClose: () => void
  onSave: (input: CreateDockerContainerInput) => Promise<void>
}

export function ContainerFormModal({
  initial,
  onClose,
  onSave,
}: ContainerFormModalProps) {
  const editing = Boolean(initial)
  const [form, setForm] = useState<CreateDockerContainerInput>(() => ({
    name: initial?.names ?? '',
    image: initial?.image ?? '',
    command: initial?.command ?? '',
  }))
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑容器' : '创建容器'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Docker 不能原地修改镜像或启动命令；此处可安全地重命名容器。'
              : '创建后将以后台模式启动容器。'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <Field label="容器名称" hint={editing ? undefined : '可选'}>
            <Input
              required={editing}
              value={form.name ?? ''}
              onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
              placeholder="my-app"
              autoFocus
            />
          </Field>

          <Field label="镜像">
            <Input
              required
              disabled={editing}
              value={form.image}
              onChange={(event) => setForm((value) => ({ ...value, image: event.target.value }))}
              placeholder="nginx:latest"
            />
          </Field>

          <Field label="启动命令" hint={editing ? undefined : '可选，使用 sh -c 执行'}>
            <Input
              disabled={editing}
              value={form.command ?? ''}
              onChange={(event) => setForm((value) => ({ ...value, command: event.target.value }))}
              placeholder="npm run start"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? '保存更改' : '创建容器'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {hint && <span className="font-normal">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
