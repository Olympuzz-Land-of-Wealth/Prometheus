const BASE = 'http://localhost:8000';

export async function uploadVideo(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  return res.json(); // { session_id, status }
}

// Poll until analysis is ready. Resolves with session_id.
export async function waitForAnalysis(sessionId, { maxAttempts = 60, intervalMs = 1000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE}/api/status?session_id=${sessionId}`);
    if (!res.ok) throw new Error('Status check failed');
    const { status } = await res.json();
    if (status === 'ready') return sessionId;
    if (status === 'error') throw new Error('Analysis failed on server');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Analysis timed out');
}

export async function fetchResults(sessionId) {
  const res = await fetch(`${BASE}/api/results?session_id=${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch results');
  return res.json();
}

export async function fetchUploads() {
  const res = await fetch(`${BASE}/api/uploads`);
  if (!res.ok) throw new Error('Failed to fetch uploads');
  return res.json();
}

export function videoUrl(sessionId) {
  return `${BASE}/api/video?session_id=${sessionId}`;
}
