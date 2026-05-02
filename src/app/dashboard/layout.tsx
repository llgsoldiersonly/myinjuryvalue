import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash md:flex">
      {/* Mobile top bar */}
      <header className="md:hidden bg-[#0F1626] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <p className="font-extrabold">
          <span className="text-white">My</span>
          <span className="text-brand-blueLight">Injury</span>
          <span className="text-white">Value</span>
        </p>
        <nav className="flex gap-3 text-sm">
          <NavItem href="/dashboard">Leads</NavItem>
          <NavItem href="/dashboard/calls">Calls</NavItem>
          <NavItem href="/dashboard/settings">Settings</NavItem>
        </nav>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 bg-[#0F1626] border-r border-white/5 min-h-screen">
        <div className="p-4 border-b border-white/5">
          <p className="font-extrabold text-lg">
            <span className="text-white">My</span>
            <span className="text-brand-blueLight">Injury</span>
            <span className="text-white">Value</span>
          </p>
          <p className="text-xs text-slate-400">Intake dashboard</p>
        </div>
        <nav className="p-3 space-y-1 text-sm">
          <NavItem href="/dashboard" block>Leads</NavItem>
          <NavItem href="/dashboard/calls" block>Calls</NavItem>
          <NavItem href="/dashboard/settings" block>Settings</NavItem>
        </nav>
      </aside>
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
}

function NavItem({
  href,
  children,
  block = false,
}: {
  href: string;
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${block ? "block" : "inline-flex"} px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white`}
    >
      {children}
    </Link>
  );
}
