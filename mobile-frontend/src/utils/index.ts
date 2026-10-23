export const fmt = {
  currency: (n: number) => `$${n.toFixed(2)}`,
  date: (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
  time: (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  status: (s: string) =>
    s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
};

export const localId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
