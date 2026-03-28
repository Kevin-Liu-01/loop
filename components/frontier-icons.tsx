import type { ComponentProps } from "react";

import {
  Activity,
  ArrowRight,
  Boxes,
  Download,
  FilePenLine,
  Link2,
  ListTree,
  PencilLine,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Workflow,
  type LucideIcon
} from "lucide-react";

type IconProps = ComponentProps<typeof Radar> & {
  title?: string;
};

function wrapIcon(Component: LucideIcon) {
  return function LoopIcon({ title, strokeWidth = 1.7, ...props }: IconProps) {
    return (
      <Component
        absoluteStrokeWidth
        aria-hidden={title ? undefined : true}
        aria-label={title}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  };
}

export const RadarIcon = wrapIcon(Radar);
export const CubeStackIcon = wrapIcon(Boxes);
export const PulseIcon = wrapIcon(Activity);
export const SearchIcon = wrapIcon(Search);
export const SparkIcon = wrapIcon(Sparkles);
export const WalletIcon = wrapIcon(Wallet);
export const FlowIcon = wrapIcon(Workflow);
export const TimelineIcon = wrapIcon(ListTree);
export const ShieldIcon = wrapIcon(ShieldCheck);
export const ArrowRightIcon = wrapIcon(ArrowRight);
export const DownloadIcon = wrapIcon(Download);
export const LinkIcon = wrapIcon(Link2);
export const PencilIcon = wrapIcon(PencilLine);
export const EditFileIcon = wrapIcon(FilePenLine);
export const RefreshIcon = wrapIcon(RefreshCw);
