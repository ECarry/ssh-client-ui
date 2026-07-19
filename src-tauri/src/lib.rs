mod ssh;

use ssh::SshManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(SshManager::default())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      ssh::ssh_connect,
      ssh::ssh_send_input,
      ssh::ssh_resize,
      ssh::ssh_disconnect,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
