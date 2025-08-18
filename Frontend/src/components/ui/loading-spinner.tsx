import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const LoadingSpinner = ({
  size = "md",
  text,
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-slate-300 border-t-primary",
          sizeClasses[size]
        )}
      />
      {text && (
        <span
          className={cn(
            "text-slate-600 dark:text-slate-400",
            textSizeClasses[size]
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
