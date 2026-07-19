"use client";
import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
type SlideInProps = HTMLMotionProps<"div"> & {
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
};
function SlideIn({
  direction = "up",
  delay = 0,
  initial,
  animate,
  transition,
  ...props
}: SlideInProps) {
  const reduced = useReducedMotion();
  const offset = { up: { y: 12 }, down: { y: -12 }, left: { x: 12 }, right: { x: -12 } }[direction];
  return (
    <motion.div
      initial={initial ?? (reduced ? false : { opacity: 0, ...offset })}
      animate={animate ?? { opacity: 1, x: 0, y: 0 }}
      transition={transition ?? { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}
export { SlideIn };
