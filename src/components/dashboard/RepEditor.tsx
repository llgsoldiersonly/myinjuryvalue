"use client";
import { useState } from "react";

interface Rep {
  id: string;
  name: string;
  phone: string;
  priority_order: number;
  active: boolean;
  timezone?: string | null;
  working_hours_start?: string | null;
  working_hours_end?: string | null;
}

export function RepEditor({ reps }: { reps: Rep[] }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // Initialize order from props once. After mount, `order` is the source of
  // truth so optimistic updates never get overwritten by a stale router.refresh.
  const [order, setOrder] = useState<Rep[]>(() =>
    [...reps].sort((a, b) => a.priority_order - b.priority_order)
  );
  const [priority, setPriority] = useState(reps.length + 1);
  const [dragId, setDragId] = useState<string | null>(null);

  async function add() {
    if (!name.trim() || !phone.trim()) return;
    setBusy(true);
    let res: Response;
    try {
      res = await fetch("/api/dashboard/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, priority_order: priority, active: true }),
      });
    } catch (e) {
      setBusy(false);
      alert(`Network error: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    setBusy(false);
    if (!res.ok) {
      alert(`Failed to add rep (${res.status}): ${await res.text()}`);
      return;
    }
    const json = await res.json().catch(() => ({}));
    const newRep = json.rep as Rep | undefined;
    if (newRep) {
      setOrder((cur) => [...cur, newRep].sort((a, b) => a.priority_order - b.priority_order));
    }
    setName("");
    setPhone("");
    setPriority((p) => p + 1);
  }

  async function remove(id: string) {
    if (!confirm("Remove this rep?")) return;
    setBusy(true);
    const res = await fetch(`/api/dashboard/reps?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { alert(`Failed to remove (${res.status}): ${await res.text()}`); return; }
    setOrder((cur) => cur.filter((r) => r.id !== id));
  }

  async function toggle(rep: Rep) {
    setBusy(true);
    const res = await fetch("/api/dashboard/reps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rep.id, active: !rep.active }),
    });
    setBusy(false);
    if (!res.ok) { alert(`Failed to toggle (${res.status}): ${await res.text()}`); return; }
    setOrder((cur) => cur.map((r) => (r.id === rep.id ? { ...r, active: !rep.active } : r)));
  }

  async function persistOrder(next: Rep[]) {
    setBusy(true);
    // assign new priority_order = index+1, only PATCH the ones that changed
    const updates = next
      .map((r, i) => ({ id: r.id, priority_order: i + 1, before: r.priority_order }))
      .filter((u) => u.priority_order !== u.before);
    try {
      await Promise.all(
        updates.map((u) =>
          fetch("/api/dashboard/reps", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: u.id, priority_order: u.priority_order }),
          })
        )
      );
      // local order state is already correct; no router.refresh needed
    } finally {
      setBusy(false);
    }
  }

  function onDragStart(id: string) { setDragId(id); }
  function onDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    const next = [...order];
    const from = next.findIndex((r) => r.id === dragId);
    const to = next.findIndex((r) => r.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  }
  function onDrop() {
    setDragId(null);
    void persistOrder(order);
  }

  function move(id: string, dir: -1 | 1) {
    const i = order.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    void persistOrder(next);
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="bg-[#0F1626] border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add rep</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 text-slate-200 flex-1 min-w-[180px]"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1XXXXXXXXXX"
            className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 text-slate-200 flex-1 min-w-[180px]"
          />
          <input
            type="number"
            min={1}
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
            placeholder="Priority"
            className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 text-slate-200 w-28"
          />
          <button
            onClick={add}
            disabled={busy}
            className="text-sm rounded-lg px-3 py-2 bg-brand-blue text-white font-semibold disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0F1626]">
        <div className="p-3 border-b border-white/5 text-xs text-slate-400">
          Drag rows to reorder priority, or use the ↑/↓ buttons. Position 1 is dialed first.
        </div>
        <ul>
          {order.map((r, i) => (
            <li
              key={r.id}
              draggable
              onDragStart={() => onDragStart(r.id)}
              onDragOver={(e) => onDragOver(e, r.id)}
              onDrop={onDrop}
              className={`flex items-center gap-3 px-3 py-3 border-t border-white/5 first:border-0 cursor-move ${dragId === r.id ? "opacity-50 bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
            >
              <span className="text-slate-500 select-none w-6">≡</span>
              <span className="text-slate-200 w-6 text-center font-bold">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{r.name}</p>
                <p className="text-xs text-slate-400">{r.phone}</p>
              </div>
              <button
                onClick={() => move(r.id, -1)}
                disabled={busy || i === 0}
                className="text-xs px-2 py-1 rounded-md border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-30"
              >↑</button>
              <button
                onClick={() => move(r.id, 1)}
                disabled={busy || i === order.length - 1}
                className="text-xs px-2 py-1 rounded-md border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-30"
              >↓</button>
              <button
                onClick={() => toggle(r)}
                disabled={busy}
                className={`text-xs px-2 py-1 rounded-md border ${r.active ? "bg-green-500/15 text-green-300 border-green-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}
              >
                {r.active ? "Active" : "Disabled"}
              </button>
              <button
                onClick={() => remove(r.id)}
                className="text-xs text-red-300 hover:text-red-200 px-2 py-1"
              >
                Remove
              </button>
            </li>
          ))}
          {order.length === 0 && (
            <li className="text-center py-10 text-slate-500">
              No reps yet — add one to enable warm transfer.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
