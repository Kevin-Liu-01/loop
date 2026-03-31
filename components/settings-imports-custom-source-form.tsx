"use client";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel, textFieldBase } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/cn";

type SettingsImportsCustomSourceFormProps = {
  isOperator: boolean;
};

export function SettingsImportsCustomSourceForm({ isOperator }: SettingsImportsCustomSourceFormProps) {
  return (
    <>
      <form
        className={cn("grid gap-4", !isOperator && "pointer-events-none opacity-60")}
        id="settings-imports-custom-source"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel>Display name</FieldLabel>
            <input
              name="name"
              placeholder="e.g. Acme internal skills"
              disabled={!isOperator}
              className={cn(textFieldBase, "min-h-11 py-3")}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>GitHub org or user</FieldLabel>
            <input
              name="org"
              placeholder="organization"
              disabled={!isOperator}
              className={cn(textFieldBase, "min-h-11 py-3")}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Repository</FieldLabel>
            <input
              name="repo"
              placeholder="repo-name"
              disabled={!isOperator}
              className={cn(textFieldBase, "min-h-11 py-3")}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Branch</FieldLabel>
            <input
              name="branch"
              placeholder="main"
              disabled={!isOperator}
              className={cn(textFieldBase, "min-h-11 py-3")}
            />
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel>Skills path</FieldLabel>
          <input
            name="skillsPath"
            placeholder="skills or packages/skills"
            disabled={!isOperator}
            className={cn(textFieldBase, "min-h-11 py-3 text-sm")}
          />
        </FieldGroup>
      </form>

      <div className="relative z-[1] flex flex-wrap items-center gap-3">
        <Button disabled={!isOperator} form="settings-imports-custom-source" type="submit">
          Add import source
        </Button>
        {!isOperator ? (
          <LinkButton href="/settings/subscription" size="sm" variant="ghost">
            View plans
          </LinkButton>
        ) : (
          <p className="m-0 text-xs text-ink-faint">Saving custom sources will ship in a follow-up release.</p>
        )}
      </div>
    </>
  );
}
