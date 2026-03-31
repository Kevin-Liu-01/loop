"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type DownloadSkillButtonProps = {
  body: string;
  filename: string;
};

export function DownloadSkillButton({ body, filename }: DownloadSkillButtonProps) {
  function handleDownload() {
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      className="text-xs"
      onClick={handleDownload}
      size="sm"
      type="button"
      variant="soft"
    >
      <Download className="mr-1 h-3 w-3" aria-hidden />
      Download .md
    </Button>
  );
}
