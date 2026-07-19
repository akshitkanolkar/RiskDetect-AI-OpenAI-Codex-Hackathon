"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface StaggerChildrenProps extends HTMLMotionProps<"div"> {
  stagger?: number;
  delayChildren?: number;
}

function StaggerChildren({
  stagger = 0.08,
  delayChildren = 0,
  initial,
  animate,
  variants,
  ...props
}: StaggerChildrenProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={initial ?? (reduced ? false : "hidden")}
      animate={animate ?? "show"}
      variants={
        variants ?? {
          hidden: {},
          show: {
            transition: {
              staggerChildren: reduced ? 0 : stagger,
              delayChildren: reduced ? 0 : delayChildren,
            },
          },
        }
      }
      {...props}
    />
  );
}

const staggerItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={reduced ? undefined : staggerItemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { StaggerChildren, StaggerItem, staggerItemVariants as staggerItem };
