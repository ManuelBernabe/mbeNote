import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

let connection: HubConnection | null = null;

/**
 * Returns a singleton SignalR HubConnection that authenticates via JWT
 * passed as a query-string parameter (required for WebSocket transport).
 */
export function getConnection(): HubConnection {
  if (connection) return connection;

  const token = localStorage.getItem("token") ?? "";

  connection = new HubConnectionBuilder()
    .withUrl(`/hubs/notifications?access_token=${encodeURIComponent(token)}`)
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  return connection;
}

/**
 * Start the connection if it is not already connected / connecting.
 */
export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (
    conn.state === HubConnectionState.Disconnected
  ) {
    await conn.start();
  }
}

/**
 * Stop the connection and dispose the singleton so a fresh one can be created
 * (e.g. after logout / token refresh).
 */
export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
