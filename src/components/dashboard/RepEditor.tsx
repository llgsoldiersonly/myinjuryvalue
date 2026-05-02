"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [priority, setPriority] = useState(reps.length + 1);

  async function add() {
    if (!name.trim() || !phone.trim()) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/reps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, priority_order: priority, active: true }),
    });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else { setName(""); setPhone(""); router.refresh(); }
  }

  async function remove(id: string) {
    if (!confirm("Remove this rep?")) return;
    setBusy(true);
    const res = await fetch(`/api/dashboard/reps?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else router.refresh();
  }

  async function toggle(rep: Rep) {
    setBusy(true);
    const res = await fetch("/api/dashboard/reps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rep.id, active: !rep.active }),
    });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else router.refresh();
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

      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1626] text-slate-400">
            <tr className="text-left">
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Active</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {reps.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-3 py-3 text-slate-200">{r.priority_order}</td>
                <td className="px-3 py-3 text-white font-semibold">{r.name}</td>
                <td className="px-3 py-3 text-slate-200">{r.phone}</td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => toggle(r)}
                    className={`text-xs px-2 py-1 rounded-md border ${r.active ? "bg-green-500/15 text-green-300 border-green-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}
                  >
                    {r.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => remove(r.id)} className="text-xs text-red-300 hover:text-red-200">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {reps.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500">
                  No reps yet — add one to enable warm transfer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
