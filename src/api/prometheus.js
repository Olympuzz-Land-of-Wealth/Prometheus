const BASE = 'http://localhost:8000';

export async function uploadVideo(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  return res.json(); // { session_id, status }
}

// Poll until machines are ready. Resolves with machine list.
export async function waitForMachines(sessionId, { maxAttempts = 30, intervalMs = 1000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE}/api/machines?session_id=${sessionId}`);
    if (res.status === 200) return res.json();
    if (res.status !== 202) throw new Error('Detection failed');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Detection timed out');
}

// Returns a WebSocket connected to the occupancy stream.
export function openOccupancySocket(sessionId) {
  return new WebSocket(`ws://localhost:8000/ws/occupancy?session_id=${sessionId}`);
}
