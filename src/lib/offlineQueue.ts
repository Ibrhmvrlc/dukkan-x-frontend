import axios from '../api/axios';

export interface OfflineRequest {
  url: string;
  method: string;
  data?: unknown;
  headers?: Record<string, unknown>;
}

const KEY = 'offlineQueue';

function getQueue(): OfflineRequest[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function setQueue(queue: OfflineRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function saveRequest(req: OfflineRequest) {
  const queue = getQueue();
  queue.push(req);
  setQueue(queue);
}

export async function flushQueue() {
  const queue = getQueue();
  while (queue.length) {
    const req = queue.shift() as OfflineRequest;
    try {
      await axios({
        url: req.url,
        method: req.method as any,
        data: req.data,
        headers: req.headers as any,
      });
    } catch {
      queue.unshift(req);
      break;
    }
  }
  setQueue(queue);
}

export function registerFlushOnOnline() {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', flushQueue);
  }
}
