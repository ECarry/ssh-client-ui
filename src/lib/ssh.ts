import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface SshConnectConfig {
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  keyPath?: string
  keyPassphrase?: string
  cols: number
  rows: number
}

interface SshDataPayload {
  id: string
  data: number[]
}

interface SshClosedPayload {
  id: string
}

/** Open an SSH connection with an interactive PTY. Returns the session id. */
export function sshConnect(config: SshConnectConfig): Promise<string> {
  return invoke<string>('ssh_connect', { config })
}

/** Send keystrokes / input bytes to the remote shell. */
export function sshSendInput(id: string, data: string): Promise<void> {
  return invoke('ssh_send_input', { id, data })
}

/** Inform the remote PTY of a new terminal size. */
export function sshResize(id: string, cols: number, rows: number): Promise<void> {
  return invoke('ssh_resize', { id, cols, rows })
}

/** Close the SSH session. */
export function sshDisconnect(id: string): Promise<void> {
  return invoke('ssh_disconnect', { id })
}

/** Subscribe to shell output for a given session id. */
export async function onSshData(
  id: string,
  cb: (bytes: Uint8Array) => void,
): Promise<UnlistenFn> {
  return listen<SshDataPayload>('ssh:data', (event) => {
    if (event.payload.id === id) {
      cb(new Uint8Array(event.payload.data))
    }
  })
}

/** Subscribe to the session-closed event for a given session id. */
export async function onSshClosed(
  id: string,
  cb: () => void,
): Promise<UnlistenFn> {
  return listen<SshClosedPayload>('ssh:closed', (event) => {
    if (event.payload.id === id) cb()
  })
}
