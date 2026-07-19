"use client";
import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  onClear?: () => void;
}
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, defaultValue, onClear, ...props }, ref) => {
    const displayValue = value ?? defaultValue;
    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          value={value}
          defaultValue={defaultValue}
          className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        {displayValue && onClear && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onClear}
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
export { SearchInput };
