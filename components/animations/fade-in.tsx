"use client";
import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
type FadeInProps = HTMLMotionProps<"div"> & { delay?: number };
function FadeIn({ delay = 0, initial, animate, transition, ...props }: FadeInProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={initial ?? (reduced ? false : { opacity: 0 })}
      animate={animate ?? { opacity: 1 }}
      transition={transition ?? { duration: 0.25, delay, ease: "easeOut" }}
      {...props}
    />
  );
}
export { FadeIn };
