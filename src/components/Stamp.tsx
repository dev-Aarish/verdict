import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface StampProps {
  children: ReactNode;
  rotation?: number;
  variant?: "brass" | "red";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: "settle" | "slam" | "none";
  label?: string;
  className?: string;
}

const sizeMap = {
  xs: "text-lg min-w-[2.75rem] min-h-[2.75rem] p-1.5",
  sm: "text-xl md:text-2xl min-w-[3.75rem] min-h-[3.75rem] md:min-w-[4.25rem] md:min-h-[4.25rem] p-2",
  md: "text-3xl md:text-4xl min-w-[5rem] min-h-[5rem] md:min-w-[5.5rem] md:min-h-[5.5rem] p-3",
  lg: "text-5xl md:text-7xl min-w-[6.5rem] min-h-[6.5rem] md:min-w-[8rem] md:min-h-[8rem] p-4",
  xl: "text-7xl sm:text-8xl md:text-[9.5rem] leading-none min-w-[8.5rem] min-h-[8.5rem] sm:min-w-[10.5rem] sm:min-h-[10.5rem] md:min-w-[12rem] md:min-h-[12rem] p-5",
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
  const initialStyles =
    animate === "slam"
      ? { scale: 1.8, opacity: 0, rotate: 0 }
      : animate === "settle"
      ? { scale: 1.15, opacity: 0, rotate: 0 }
      : { scale: 1, opacity: 1, rotate: rotation };

  const transition =
    animate === "slam"
      ? { type: "spring", damping: 14, stiffness: 220, mass: 0.9 }
      : { type: "spring", damping: 22, stiffness: 140 };

  return (
    <motion.div
      initial={initialStyles}
      animate={{ scale: 1, opacity: 1, rotate: rotation }}
      transition={transition}
      style={{ rotate: rotation }}
      className={cn(
        "stamp-frame flex-col gap-0.5 shrink-0 select-none",
        variant === "red" && "stamp-red",
        sizeMap[size],
        className
      )}
    >
      {label && (
        <span className="text-caption text-[0.52rem] md:text-[0.58rem] tracking-[0.25em] opacity-80 whitespace-nowrap">
          {label}
        </span>
      )}
      <span className="leading-none font-bold">{children}</span>
    </motion.div>
  );
}
