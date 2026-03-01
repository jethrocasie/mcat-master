import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl",
        {
          "card-shadow": variant === "default",
          "card-shadow-lg": variant === "elevated",
          "border border-slate-200": variant === "bordered",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
