import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

let connection: HubConnection | null = null;

export function getConnection(): HubConnection {
  if (connection) return connection;

  const token = localStorage.getItem("token") ?? "";

  // Use absolute URL to avoid proxy issues in production
  const baseUrl = window.location.origin;

  connection = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/notifications`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build();

  connection.onreconnecting((error) => {
    console.warn("[SignalR] Reconnecting...", error);
  });

  connection.onreconnected((connectionId) => {
    console.log("[SignalR] Reconnected:", connectionId);
  });

  connection.onclose((error) => {
    console.warn("[SignalR] Connection closed:", error);
    connection = null;
  });

  return connection;
}

export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log("[SignalR] Connected successfully");
    } catch (err) {
      console.error("[SignalR] Connection failed:", err);
      // Retry after 5 seconds
      setTimeout(() => startConnection(), 5000);
    }
  }
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.stop();
    } catch {}
    connection = null;
  }
}
