import { io } from 'socket.io-client';

let socket = null;

/** Lazily creates a single authenticated socket connection for the session. */
export function getSocket() {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('kgisl_token');
  const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://project-xpdv.onrender.com/api/v1' : '/api/v1');
  // Strip '/api/v1' to get the base domain for the socket connection
  const serverUrl = apiBase.replace(/\/api\/v1\/?$/, '') || '/';

  socket = io(serverUrl, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
