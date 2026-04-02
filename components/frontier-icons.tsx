import type { ComponentProps } from "react";

import {
  Activity,
  ArrowRight,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDot,
  Clipboard,
  Clock,
  Code,
  Copy,
  Cpu,
  CreditCard,
  Download,
  Eye,
  File,
  FileCode,
  FilePenLine,
  Folder,
  FolderOpen,
  Globe,
  HardDrive,
  Hash,
  History,
  KeyRound,
  Link2,
  ListTree,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  PanelLeft,
  PanelRight,
  PencilLine,
  Play,
  Plus,
  Radar,
  RefreshCw,
  RotateCcw,
  Scan,
  Search,
  Send,
  Settings,
  Share2,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  Square,
  Tag,
  Terminal,
  Timer,
  Trash2,
  TriangleAlert,
  User,
  Wallet,
  Workflow,
  X,
  Zap,
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
export const SettingsIcon = wrapIcon(Settings);
export const SlidersIcon = wrapIcon(SlidersHorizontal);
export const PlusIcon = wrapIcon(Plus);
export const TerminalIcon = wrapIcon(Terminal);
export const CodeIcon = wrapIcon(Code);
export const FileCodeIcon = wrapIcon(FileCode);
export const PlayIcon = wrapIcon(Play);
export const StopIcon = wrapIcon(Square);
export const SendIcon = wrapIcon(Send);
export const ChevronDownIcon = wrapIcon(ChevronDown);
export const ChevronRightIcon = wrapIcon(ChevronRight);
export const ShareIcon = wrapIcon(Share2);
export const ClockIcon = wrapIcon(Clock);
export const MessageIcon = wrapIcon(MessageSquare);
export const UserIcon = wrapIcon(User);
export const BotIcon = wrapIcon(Bot);
export const CreditCardIcon = wrapIcon(CreditCard);
export const ZapIcon = wrapIcon(Zap);
export const LogOutIcon = wrapIcon(LogOut);
export const PanelLeftIcon = wrapIcon(PanelLeft);
export const KeyIcon = wrapIcon(KeyRound);
export const GlobeIcon = wrapIcon(Globe);
export const ClipboardIcon = wrapIcon(Clipboard);
export const CheckIcon = wrapIcon(Check);
export const ChevronUpIcon = wrapIcon(ChevronUp);
export const ResetIcon = wrapIcon(RotateCcw);
export const TagIcon = wrapIcon(Tag);
export const HashIcon = wrapIcon(Hash);
export const EyeIcon = wrapIcon(Eye);
export const ScanIcon = wrapIcon(Scan);
export const CircleDotIcon = wrapIcon(CircleDot);
export const TriangleAlertIcon = wrapIcon(TriangleAlert);
export const CopyIcon = wrapIcon(Copy);
export const CpuIcon = wrapIcon(Cpu);
export const FileIcon = wrapIcon(File);
export const FolderIcon = wrapIcon(Folder);
export const FolderOpenIcon = wrapIcon(FolderOpen);
export const HardDriveIcon = wrapIcon(HardDrive);
export const PackageIcon = wrapIcon(Package);
export const PaletteIcon = wrapIcon(Palette);
export const PanelRightIcon = wrapIcon(PanelRight);
export const TimerIcon = wrapIcon(Timer);
export const ChevronLeftIcon = wrapIcon(ChevronLeft);
export const AutomationIcon = wrapIcon(History);
export const TrashIcon = wrapIcon(Trash2);
export const XIcon = wrapIcon(X);

/* ── Brand icons (no Lucide equivalent) ── */

type SvgIconProps = React.SVGProps<SVGSVGElement> & { title?: string };

export function NodeIcon({ title, className, ...props }: SvgIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      <path d="M12 2 L22 7.5 L22 16.5 L12 22 L2 16.5 L2 7.5 Z" />
      <path d="M12 22 L12 12" />
      <path d="M2 7.5 L12 12 L22 7.5" />
    </svg>
  );
}

export function PythonIcon({ title, className, ...props }: SvgIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      <path d="M12 2C8 2 8 4 8 5v2h4v1H6c-2 0-4 1.5-4 5s2 5 4 5h2v-2.5c0-2 1.5-3.5 3.5-3.5H16c1.5 0 2.5-1 2.5-2.5V5c0-1.5-1.5-3-3-3h-3.5Z" />
      <path d="M12 22c4 0 4-2 4-3v-2h-4v-1h6c2 0 4-1.5 4-5s-2-5-4-5h-2v2.5c0 2-1.5 3.5-3.5 3.5H8c-1.5 0-2.5 1-2.5 2.5V19c0 1.5 1.5 3 3 3h3.5Z" />
      <circle cx="10" cy="5.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="14" cy="18.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
