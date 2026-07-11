import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface StampProps {
  children: ReactNode;
  rotation?: number;
  variant?: "brass" | "red";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: "settle" | "slam" | "none";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: "text-2xl px-4 py-2 min-w-[3.5rem]",
  md: "text-4xl px-5 py-3 min-w-[5rem]",
  lg: "text-7xl px-8 py-5 min-w-[8rem]",
  xl: "text-[10rem] leading-none px-12 py-8 min-w-[14rem]",
};

export function Stamp({
  children,
  rotation = -3,
  variant = "brass",
  size = "md",
  animate = "none",
  label,
  className,
}: StampProps) {
  const style = { "--stamp-rot": `${rotation}deg` } as CSSProperties;
  return (
    <div
      style={style}
      className={cn(
        "stamp-frame flex-col gap-1",
        variant === "red" && "stamp-red",
        sizeMap[size],
        animate === "settle" && "animate-stamp-settle",
        animate === "slam" && "animate-stamp-slam",
        className,
      )}
    >
      {label && (
        <span className="text-caption text-[0.55rem] tracking-[0.3em] opacity-80">
          {label}
        </span>
      )}
      <span className="leading-none">{children}</span>
      {label && (
        <span className="text-caption text-[0.5rem] tracking-[0.25em] opacity-60">
          / 100
        </span>
      )}
    </div>
  );
}
