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
          variant === "primary" ? "apple-button" : "apple-button-secondary",
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