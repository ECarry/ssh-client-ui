import { invoke } from '@tauri-apps/api/core'
import type { Server, ServerGroup } from '@/types'

export interface AppConfig {
  servers: Server[]
  groups: ServerGroup[]
}

/** Load the persisted server config. Passwords are hydrated from the OS keychain. */
export function loadConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('load_config')
}

/** Persist the server config. Plaintext passwords are moved to the OS keychain. */
export function saveConfig(config: AppConfig): Promise<void> {
  return invoke('save_config', { config })
}

/** Remove a server's stored password from the keychain. */
export function deleteServerSecret(serverId: string): Promise<void> {
  return invoke('delete_server_secret', { serverId })
}
