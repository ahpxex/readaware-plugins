# WebDAV Sync

Sync your end-to-end encrypted ReadAware library through your own WebDAV
server (Nextcloud, 坚果云, or any standards-speaking host) instead of the
ReadAware relay.

The plugin is a `sync:transport` provider: the app's sync engine keeps
everything that matters — encryption, the event log, merge, cursors — and
hands this plugin only sealed ciphertext to carry. The server you point it at
never sees event types, book bytes, annotations, or keys; a passphrase set on
the first device (and required on every other one) is the only way to open
anything it stores.

## Setup

1. Enable the plugin, then open its settings and fill in the server URL,
   username, password, and the folder to store data under (created if
   missing). Many providers require an app-specific password for WebDAV.
2. Go to Settings → Plugin Sync and select WebDAV. Connect to check the
   server and enter the encryption passphrase. Use **Sync now** whenever you
   want to synchronize; plugin transports do not sync automatically.
3. Repeat on every device with the same server and passphrase.

Using the WebDAV backend and a ReadAware account are mutually exclusive —
one sync mailbox at a time. Switching backends re-uploads history to the new
one; nothing local is lost.

## Source

First-party plugin. `main.js` is bundled unminified from the canonical
source in the app repository:
<https://github.com/ahpxex/read-aware/tree/main/plugins/webdav-sync>

Requires ReadAware ≥ 0.6.0 (the versioned transport-session API).
