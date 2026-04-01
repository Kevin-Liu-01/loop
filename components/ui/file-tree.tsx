import { FileCodeIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@/components/frontier-icons";
import { cn } from "@/lib/cn";

export type FileTreeEntry = {
  name: string;
  type: "file" | "folder";
  icon?: "markdown" | "code" | "generic";
  children?: FileTreeEntry[];
};

type FileTreeProps = {
  entries: FileTreeEntry[];
  className?: string;
};

type FileTreeNodeProps = {
  entry: FileTreeEntry;
  depth: number;
  isLast: boolean;
  parentPrefixes: boolean[];
};

const ICON_CLASS = "h-3.5 w-3.5 shrink-0";

function getFileIcon(entry: FileTreeEntry) {
  if (entry.type === "folder") {
    return entry.children && entry.children.length > 0
      ? <FolderOpenIcon className={cn(ICON_CLASS, "text-accent")} />
      : <FolderIcon className={cn(ICON_CLASS, "text-ink-soft")} />;
  }
  if (entry.icon === "markdown" || entry.name.endsWith(".md")) {
    return <FileCodeIcon className={cn(ICON_CLASS, "text-blue-500 dark:text-blue-400")} />;
  }
  if (entry.icon === "code") {
    return <FileCodeIcon className={cn(ICON_CLASS, "text-ink-soft")} />;
  }
  return <FileIcon className={cn(ICON_CLASS, "text-ink-faint")} />;
}

function TreePrefix({ parentPrefixes, isLast }: { parentPrefixes: boolean[]; isLast: boolean }) {
  return (
    <span className="inline-flex select-none text-line" aria-hidden>
      {parentPrefixes.map((isParentLast, i) => (
        <span key={i} className="inline-block w-5 text-center">
          {isParentLast ? "\u00A0" : "\u2502"}
        </span>
      ))}
      <span className="inline-block w-5 text-center">
        {isLast ? "\u2514" : "\u251C"}
      </span>
    </span>
  );
}

function FileTreeNode({ entry, depth, isLast, parentPrefixes }: FileTreeNodeProps) {
  const children = entry.children ?? [];

  return (
    <>
      <div className="flex items-center gap-1.5 py-1 font-mono text-[0.8rem] leading-none">
        {depth > 0 && <TreePrefix parentPrefixes={parentPrefixes} isLast={isLast} />}
        {getFileIcon(entry)}
        <span className={cn(
          "truncate",
          entry.type === "folder" ? "font-medium text-ink" : "text-ink-soft"
        )}>
          {entry.name}
        </span>
      </div>
      {children.map((child, i) => (
        <FileTreeNode
          key={child.name}
          entry={child}
          depth={depth + 1}
          isLast={i === children.length - 1}
          parentPrefixes={[...parentPrefixes, isLast]}
        />
      ))}
    </>
  );
}

export function FileTree({ entries, className }: FileTreeProps) {
  if (entries.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-none border border-line bg-paper-2/50 px-4 py-3 dark:bg-paper-2/25",
        className
      )}
      role="tree"
      aria-label="File tree"
    >
      {entries.map((entry, i) => (
        <FileTreeNode
          key={entry.name}
          entry={entry}
          depth={0}
          isLast={i === entries.length - 1}
          parentPrefixes={[]}
        />
      ))}
    </div>
  );
}
