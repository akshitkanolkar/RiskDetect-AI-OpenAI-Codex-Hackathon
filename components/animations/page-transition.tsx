"use client";
import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
function PageTransition({ initial, animate, transition, ...props }: HTMLMotionProps<"main">) {
  const reduced = useReducedMotion();
  return (
    <motion.main
      initial={initial ?? (reduced ? false : { opacity: 0, y: 8 })}
      animate={animate ?? { opacity: 1, y: 0 }}
      transition={transition ?? { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}
export { PageTransition };
