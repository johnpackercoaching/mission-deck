import { useState, useEffect } from 'react';

export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useRelativeTime(timestamp: number | undefined, intervalMs = 15000): string {
  const [text, setText] = useState(() =>
    timestamp ? formatRelativeTime(timestamp) : ''
  );

  useEffect(() => {
    if (!timestamp) { setText(''); return; }
    setText(formatRelativeTime(timestamp));
    const id = setInterval(() => setText(formatRelativeTime(timestamp)), intervalMs);
    return () => clearInterval(id);
  }, [timestamp, intervalMs]);

  return text;
}
