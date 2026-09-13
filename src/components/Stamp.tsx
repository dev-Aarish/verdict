import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";

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
  sm: "text-2xl min-w-[4.5rem] min-h-[4.5rem]",
  md: "text-4xl min-w-[5.5rem] min-h-[5.5rem]",
  lg: "text-7xl min-w-[8rem] min-h-[8rem]",
  xl: "text-[10rem] leading-none min-w-[12.5rem] min-h-[12.5rem]",
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
  const initialStyles = animate === "slam" ? { scale: 1.8, opacity: 0 } 
                      : animate === "settle" ? { scale: 1.15, opacity: 0 } 
                      : { scale: 1, opacity: 1 };
                      
  const transition = animate === "slam" 
    ? { type: "spring", damping: 14, stiffness: 200, mass: 1 } 
    : { type: "spring", damping: 20, stiffness: 120 };

  return (
    <motion.div
      initial={initialStyles}
      animate={{ scale: 1, opacity: 1, rotate: rotation }}
      transition={transition}
      style={{ rotate: rotation }}
      className={cn(
        "stamp-frame flex-col gap-1",
        variant === "red" && "stamp-red",
        sizeMap[size],
        className,
      )}
    >
      {label && (
        <span className="text-caption text-[0.55rem] tracking-[0.3em] opacity-80">{label}</span>
      )}
      <span className="leading-none">{children}</span>
    </motion.div>
  );
}
