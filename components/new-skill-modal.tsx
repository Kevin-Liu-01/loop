"use client";

import { useCallback, useEffect, useState } from "react";

import { ImportSkillForm } from "@/components/import-skill-form";
import { UserSkillForm } from "@/components/user-skill-form";
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

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[10vh] max-sm:pt-4">
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative z-10 grid w-full max-w-xl gap-0 rounded-2xl border border-line bg-paper shadow-2xl max-sm:mx-3">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="m-0 text-lg font-semibold tracking-tight text-ink">
            New Skill
          </h2>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            onClick={handleClose}
            type="button"
          >
            &times;
          </button>
        </div>

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
      </div>
    </div>
  );
}
