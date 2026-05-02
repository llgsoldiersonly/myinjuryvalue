"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "new","attempted","contacted","qualified","disqualified","signed","sold","lost",
];

export function LeadActions({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [repName, setRepName] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [currentStatus, setCurrentStatus] = useState(status);

  async function call() {
    setBusy(true);
    const res = await fetch("/api/dashboard/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else alert("Calling intake rep — accept and we'll connect you.");
  }

  async function sendSms() {
    if (!smsBody.trim()) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId, body: smsBody }),
    });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else { setSmsBody(""); alert("SMS sent."); }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId, note, rep_name: repName }),
    });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else { setNote(""); router.refresh(); }
  }

  async function changeStatus(next: string) {
    setBusy(true);
    const res = await fetch("/api/dashboard/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId, status: next }),
    });
    setBusy(false);
    if (!res.ok) alert(await res.text());
    else { setCurrentStatus(next); router.refresh(); }
  }

  return (
    <div className="bg-[#0F1626] border border-white/5 rounded-2xl p-5 mt-4">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</h2>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          disabled={busy}
          onClick={call}
          className="bg-brand-yellow text-brand-navy font-bold rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          📞 Call lead now
        </button>
        <select
          value={currentStatus}
          onChange={(e) => changeStatus(e.target.value)}
          disabled={busy}
          className="bg-[#0B1220] border border-white/10 text-sm rounded-lg px-3 py-2 text-slate-200"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          disabled={busy}
          onClick={() => changeStatus("contacted")}
          className="text-sm rounded-lg px-3 py-2 border border-white/10 text-slate-200 hover:bg-white/5"
        >
          Mark contacted
        </button>
        <button
          disabled={busy}
          onClick={() => changeStatus("qualified")}
          className="text-sm rounded-lg px-3 py-2 border border-white/10 text-green-300 hover:bg-white/5"
        >
          Mark qualified
        </button>
        <button
          disabled={busy}
          onClick={() => changeStatus("disqualified")}
          className="text-sm rounded-lg px-3 py-2 border border-white/10 text-red-300 hover:bg-white/5"
        >
          Mark disqualified
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">Send SMS</label>
          <textarea
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            rows={3}
            className="w-full mt-1 bg-[#0B1220] border border-white/10 rounded-lg p-3 text-sm text-slate-200"
            placeholder="Hi {first_name}, following up on your case…"
          />
          <button
            onClick={sendSms}
            disabled={busy}
            className="mt-2 text-sm rounded-lg px-3 py-2 bg-brand-blue text-white font-semibold disabled:opacity-50"
          >
            Send SMS
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">Add note</label>
          <input
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="Your name"
            className="w-full mt-1 bg-[#0B1220] border border-white/10 rounded-lg p-2 text-sm text-slate-200"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full mt-1 bg-[#0B1220] border border-white/10 rounded-lg p-3 text-sm text-slate-200"
            placeholder="Note about this lead…"
          />
          <button
            onClick={addNote}
            disabled={busy}
            className="mt-2 text-sm rounded-lg px-3 py-2 bg-white/10 text-white border border-white/10 disabled:opacity-50"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}
