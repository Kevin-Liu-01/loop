import { cn } from "@/lib/cn";

type FieldGroupProps = {
  className?: string;
  children: React.ReactNode;
};

export function FieldGroup({ className, children }: FieldGroupProps) {
  return <label className={cn("grid gap-2", className)}>{children}</label>;
}

type FieldLabelProps = {
  className?: string;
  children: React.ReactNode;
};

export function FieldLabel({ className, children }: FieldLabelProps) {
  return (
    <span className={cn("text-xs font-medium uppercase tracking-[0.08em] text-ink-soft", className)}>
      {children}
    </span>
  );
}

export const textFieldBase =
  "min-h-[52px] w-full rounded-[14px] border border-line bg-paper-3 px-4 py-4 text-ink outline-none transition-all duration-200 focus:border-line-strong focus:shadow-[0_0_0_4px_rgba(244,244,245,1)]";

export const textFieldArea = "min-h-32 resize-y";
export const textFieldCode = "min-h-80 font-mono leading-[1.8] resize-y";
export const textFieldSelect = "appearance-none resize-none";
