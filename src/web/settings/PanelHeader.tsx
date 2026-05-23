import type { LucideIcon } from "lucide-react";

interface PanelHeaderProps {
  icon: LucideIcon;
  title: string;
}

export function PanelHeader({ icon: Icon, title }: PanelHeaderProps) {
  return (
    <h2 className="text-on-dark-strong font-mono mt-0 flex items-center gap-2">
      <Icon size={16} aria-hidden />
      {title}
    </h2>
  );
}
