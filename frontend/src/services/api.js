const API_BASE = process.env.REACT_APP_API_URL || '/api';

function getToken() {
  return localStorage.getItem('subsync_token');
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders(), ...options.headers },
    ...options,
  });
  if (res.status === 401 || res.status === 403) {
    // Token expired or invalid — clear auth
    localStorage.removeItem('subsync_token');
    window.location.hash = '#/login';
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── Subscription API ───────────────────────────────────────
export function getSubscriptions() {
  return request('/subscriptions');
}

export function getSubscription(id) {
  return request(`/subscriptions/${id}`);
}

export function createSubscription(data) {
  return request('/subscriptions', { method: 'POST', body: JSON.stringify(data) });
}

export function updateSubscription(id, data) {
  return request(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteSubscription(id) {
  return request(`/subscriptions/${id}`, { method: 'DELETE' });
}

// ─── Email Scan API (SSE streaming) ─────────────────────────
// onProgress(event) is called for each SSE update:
//   { type: 'status'|'progress'|'done'|'error', percent, scanned, total, secondsRemaining, ... }
export function scanEmail(credentials, onProgress) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('subsync_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/email-scan/connect`, {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        return reject(new Error(err.error || 'Request failed'));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            try {
              const event = JSON.parse(line.slice(5).trim());
              onProgress?.(event);

              if (event.type === 'done') {
                return resolve(event);
              }
              if (event.type === 'error') {
                return reject(new Error(event.error));
              }
            } catch (_) {}
          }
        }
      };

      pump().catch(reject);
    }).catch(reject);
  });
}

export function importDetectedSubscriptions(subscriptions) {
  return request('/email-scan/import', { method: 'POST', body: JSON.stringify({ subscriptions }) });
}
