import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NeomorphicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const NeomorphicButton = forwardRef<HTMLButtonElement, NeomorphicButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "neo-button",
          variant === "primary" && "text-neo-accent",
          variant === "secondary" && "text-neo-text",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeomorphicButton.displayName = "NeomorphicButton";

export default NeomorphicButton;