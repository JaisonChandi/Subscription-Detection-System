const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

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
