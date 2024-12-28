import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NeomorphicInputProps extends InputHTMLAttributes<HTMLInputElement> {}

const NeomorphicInput = forwardRef<HTMLInputElement, NeomorphicInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn("apple-input", className)}
        ref={ref}
        {...props}
      />
    );
  }
);

NeomorphicInput.displayName = "NeomorphicInput";

export default NeomorphicInput;