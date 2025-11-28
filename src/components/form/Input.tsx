import classNames from "classnames";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        className={classNames(
          "bg-video-context-background border border-video-context-border rounded px-3 py-2 text-white focus:outline-none focus:border-white/50 transition-colors placeholder-type-dimmed",
          className,
        )}
        {...props}
      />
    );

    if (label) {
      return (
        <label className="block">
          <span className="block text-sm font-medium mb-1 text-type-dimmed">
            {label}
          </span>
          {input}
        </label>
      );
    }

    return input;
  },
);

Input.displayName = "Input";
