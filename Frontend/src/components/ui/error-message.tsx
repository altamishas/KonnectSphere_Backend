import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "destructive";
}

const ErrorMessage = ({
  title = "Error",
  message,
  action,
  className,
  variant = "default",
}: ErrorMessageProps) => {
  return (
    <div className={cn("text-center space-y-4", className)}>
      <div className="flex justify-center">
        <AlertCircle
          className={cn(
            "h-12 w-12",
            variant === "destructive"
              ? "text-red-500"
              : "text-slate-400 dark:text-slate-500"
          )}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {message}
        </p>
      </div>

      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export default ErrorMessage;
