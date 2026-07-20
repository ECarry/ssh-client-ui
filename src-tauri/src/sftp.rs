use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Local};
use russh::client::Handle;
use russh_sftp::client::SftpSession;
use russh_sftp::protocol::FileType;
use serde::Serialize;
use tauri::State;
use tokio::io::AsyncWriteExt;

use crate::ssh::{connect_and_auth, Client, ConnectConfig};

/// A live SFTP session plus the SSH handle that keeps its connection open.
struct SftpConn {
    _session: Handle<Client>,
    sftp: Arc<SftpSession>,
}

/// Tracks open SFTP sessions, keyed by session id.
#[derive(Default)]
pub struct SftpManager {
    sessions: Mutex<HashMap<String, SftpConn>>,
}

/// A directory entry returned to the frontend (mirrors the `RemoteFile` type).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteFile {
    name: String,
    /// "file" | "dir"
    #[serde(rename = "type")]
    kind: String,
    size: u64,
    modified: String,
    permissions: String,
}

/// Pull an `Arc<SftpSession>` out of the manager for a given id.
fn session_for(state: &State<'_, SftpManager>, id: &str) -> Result<Arc<SftpSession>, String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    sessions
        .get(id)
        .map(|c| c.sftp.clone())
        .ok_or_else(|| "SFTP 会话不存在或已关闭".to_string())
}

/// Format a unix mtime as a local "YYYY-MM-DD HH:MM" string.
fn format_mtime(mtime: Option<u32>) -> String {
    match mtime {
        Some(secs) => DateTime::<Local>::from(
            std::time::UNIX_EPOCH + std::time::Duration::from_secs(secs as u64),
        )
        .format("%Y-%m-%d %H:%M")
        .to_string(),
        None => String::new(),
    }
}

/// Build an `ls -l`-style permission string, e.g. `drwxr-xr-x`.
fn format_permissions(kind: &FileType, perms: Option<u32>) -> String {
    let prefix = match kind {
        FileType::Dir => 'd',
        FileType::Symlink => 'l',
        FileType::File => '-',
        FileType::Other => '?',
    };
    match perms {
        Some(mode) => format!(
            "{prefix}{}",
            russh_sftp::protocol::FilePermissions::from(mode)
        ),
        None => format!("{prefix}?????????"),
    }
}

/// Open an SFTP session over its own SSH connection. Returns the session id.
#[tauri::command]
pub async fn sftp_connect(
    state: State<'_, SftpManager>,
    config: ConnectConfig,
) -> Result<String, String> {
    let session = connect_and_auth(&config)
        .await
        .map_err(|e| e.to_string())?;

    let channel = session
        .channel_open_session()
        .await
        .map_err(|e| e.to_string())?;
    channel
        .request_subsystem(true, "sftp")
        .await
        .map_err(|e| e.to_string())?;
    let sftp = SftpSession::new(channel.into_stream())
        .await
        .map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    state.sessions.lock().map_err(|e| e.to_string())?.insert(
        id.clone(),
        SftpConn {
            _session: session,
            sftp: Arc::new(sftp),
        },
    );

    Ok(id)
}

/// Resolve the absolute path for a (possibly relative) path — used for the home dir.
#[tauri::command]
pub async fn sftp_home(state: State<'_, SftpManager>, id: String) -> Result<String, String> {
    let sftp = session_for(&state, &id)?;
    sftp.canonicalize(".").await.map_err(|e| e.to_string())
}

/// List the contents of a remote directory.
#[tauri::command]
pub async fn sftp_list(
    state: State<'_, SftpManager>,
    id: String,
    path: String,
) -> Result<Vec<RemoteFile>, String> {
    let sftp = session_for(&state, &id)?;
    let entries = sftp.read_dir(path).await.map_err(|e| e.to_string())?;

    let mut files: Vec<RemoteFile> = entries
        .map(|entry| {
            let meta = entry.metadata();
            let kind = entry.file_type();
            RemoteFile {
                name: entry.file_name(),
                kind: if kind.is_dir() { "dir" } else { "file" }.to_string(),
                size: meta.size.unwrap_or(0),
                modified: format_mtime(meta.mtime),
                permissions: format_permissions(&kind, meta.permissions),
            }
        })
        .collect();

    // Directories first, then alphabetical.
    files.sort_by(|a, b| match (a.kind.as_str(), b.kind.as_str()) {
        ("dir", "file") => std::cmp::Ordering::Less,
        ("file", "dir") => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(files)
}

/// Download a remote file to a local path.
#[tauri::command]
pub async fn sftp_download(
    state: State<'_, SftpManager>,
    id: String,
    remote_path: String,
    local_path: String,
) -> Result<(), String> {
    let sftp = session_for(&state, &id)?;
    let mut remote = sftp.open(remote_path).await.map_err(|e| e.to_string())?;
    let mut local = tokio::fs::File::create(&local_path)
        .await
        .map_err(|e| e.to_string())?;
    tokio::io::copy(&mut remote, &mut local)
        .await
        .map_err(|e| e.to_string())?;
    local.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// Upload a local file to a remote path.
#[tauri::command]
pub async fn sftp_upload(
    state: State<'_, SftpManager>,
    id: String,
    local_path: String,
    remote_path: String,
) -> Result<(), String> {
    let sftp = session_for(&state, &id)?;
    let mut local = tokio::fs::File::open(&local_path)
        .await
        .map_err(|e| e.to_string())?;
    let mut remote = sftp.create(remote_path).await.map_err(|e| e.to_string())?;
    tokio::io::copy(&mut local, &mut remote)
        .await
        .map_err(|e| e.to_string())?;
    remote.flush().await.map_err(|e| e.to_string())?;
    remote.shutdown().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// Create a directory.
#[tauri::command]
pub async fn sftp_mkdir(
    state: State<'_, SftpManager>,
    id: String,
    path: String,
) -> Result<(), String> {
    let sftp = session_for(&state, &id)?;
    sftp.create_dir(path).await.map_err(|e| e.to_string())
}

/// Remove a file or (empty) directory.
#[tauri::command]
pub async fn sftp_remove(
    state: State<'_, SftpManager>,
    id: String,
    path: String,
    is_dir: bool,
) -> Result<(), String> {
    let sftp = session_for(&state, &id)?;
    if is_dir {
        sftp.remove_dir(path).await.map_err(|e| e.to_string())
    } else {
        sftp.remove_file(path).await.map_err(|e| e.to_string())
    }
}

/// Rename / move a remote entry.
#[tauri::command]
pub async fn sftp_rename(
    state: State<'_, SftpManager>,
    id: String,
    from: String,
    to: String,
) -> Result<(), String> {
    let sftp = session_for(&state, &id)?;
    sftp.rename(from, to).await.map_err(|e| e.to_string())
}

/// Close an SFTP session and drop its SSH connection.
#[tauri::command]
pub async fn sftp_disconnect(state: State<'_, SftpManager>, id: String) -> Result<(), String> {
    let conn = state.sessions.lock().map_err(|e| e.to_string())?.remove(&id);
    if let Some(conn) = conn {
        let _ = conn.sftp.close().await;
    }
    Ok(())
}
