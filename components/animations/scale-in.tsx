"use client";
import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
type ScaleInProps = HTMLMotionProps<"div"> & { delay?: number };
function ScaleIn({ delay = 0, initial, animate, transition, ...props }: ScaleInProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={initial ?? (reduced ? false : { opacity: 0, scale: 0.96 })}
      animate={animate ?? { opacity: 1, scale: 1 }}
      transition={transition ?? { duration: 0.25, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}
export { ScaleIn };
