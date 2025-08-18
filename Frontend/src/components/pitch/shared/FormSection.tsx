import React from "react";

interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const FormSection = ({ title, description, children }: FormSectionProps) => {
  return (
    <div className="space-y-6 pb-8 border-b border-slate-200 dark:border-slate-700 last:border-b-0 last:pb-0">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default FormSection;