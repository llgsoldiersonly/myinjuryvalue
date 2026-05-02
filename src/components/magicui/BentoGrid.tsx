import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid w-full auto-rows-[16rem] grid-cols-1 sm:grid-cols-3 gap-4", className)}>
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  description,
  Icon,
  className,
  step,
}: {
  name: string;
  description: string;
  Icon?: React.ReactNode;
  className?: string;
  step?: string;
}) {
  return (
    <div
      className={cn(
        "group relative col-span-1 overflow-hidden rounded-2xl bg-white border border-slate-200",
        "transition-all duration-300 hover:shadow-[0_8px_30px_rgba(30,91,255,0.15)] hover:border-brand-blue/40",
        className
      )}
    >
      <div className="p-6 h-full flex flex-col justify-between">
        <div>
          {step && (
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white grid place-items-center font-bold mb-3">
              {step}
            </div>
          )}
          {Icon && <div className="mb-2 text-brand-blue">{Icon}</div>}
          <h3 className="font-bold text-brand-navy text-lg">{name}</h3>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-brand-blue/[0.02]" />
    </div>
  );
}
