"use client";

import { useCallback, useEffect, useState } from "react";

import { ImportSkillForm } from "@/components/import-skill-form";
import { UserSkillForm } from "@/components/user-skill-form";
import { ModalShell } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import type { CategoryDefinition } from "@/lib/types";

type NewSkillModalProps = {
  categories: CategoryDefinition[];
};

type ModalTab = "import" | "create";

export function NewSkillModal({ categories }: NewSkillModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ModalTab>("import");

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    window.addEventListener("loop:open-new-skill", handleOpen);
    return () => window.removeEventListener("loop:open-new-skill", handleOpen);
  }, [handleOpen]);

  return (
    <ModalShell onClose={handleClose} open={open} title="New Skill">
      <div className="flex gap-0 border-b border-line px-5">
        <button
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
            tab === "import" &&
              "text-ink after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent"
          )}
          onClick={() => setTab("import")}
          type="button"
        >
          Import URL
        </button>
        <button
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
            tab === "create" &&
              "text-ink after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent"
          )}
          onClick={() => setTab("create")}
          type="button"
        >
          Create new
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-5">
        {tab === "import" ? (
          <ImportSkillForm />
        ) : (
          <UserSkillForm categories={categories} />
        )}
      </div>
    </ModalShell>
  );
}
