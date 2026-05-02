"use client";
import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Animates a number from 0 (or `from`) up to `value` once the element enters the viewport.
export function NumberTicker({
  value,
  from = 0,
  delay = 0,
  className,
  format = (n) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n)),
}: {
  value: number;
  from?: number;
  delay?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const inView = useInView(ref, { once: true, margin: "0px" });
  const [display, setDisplay] = useState(format(from));

  useEffect(() => {
    if (!inView) return;
    const timer = window.setTimeout(() => motionValue.set(value), delay * 1000);
    return () => window.clearTimeout(timer);
  }, [inView, value, delay, motionValue]);

  useEffect(() => {
    return spring.on("change", (latest) => setDisplay(format(latest)));
  }, [spring, format]);

  return <span ref={ref} className={cn("tabular-nums", className)}>{display}</span>;
}
