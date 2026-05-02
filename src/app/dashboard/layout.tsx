import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash flex">
      <aside className="w-56 shrink-0 bg-[#0F1626] border-r border-white/5 min-h-screen">
        <div className="p-4 border-b border-white/5">
          <p className="font-extrabold text-lg">
            <span className="text-white">My</span>
            <span className="text-brand-blueLight">Injury</span>
            <span className="text-white">Value</span>
          </p>
          <p className="text-xs text-slate-400">Intake dashboard</p>
        </div>
        <nav className="p-3 space-y-1 text-sm">
          <NavItem href="/dashboard">Leads</NavItem>
          <NavItem href="/dashboard/calls">Calls</NavItem>
          <NavItem href="/dashboard/settings">Settings</NavItem>
        </nav>
      </aside>
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
    >
      {children}
    </Link>
  );
}
