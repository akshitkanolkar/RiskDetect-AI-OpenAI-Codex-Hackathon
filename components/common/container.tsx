import * as React from "react";
import { cn } from "@/lib/utils";
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide";
}
function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6",
        { default: "max-w-container", narrow: "max-w-3xl", wide: "max-w-[90rem]" }[size],
        className,
      )}
      {...props}
    />
  );
}
export { Container };
