import type { DiffLine } from "@/lib/types";

type Cell = {
  length: number;
  prev?: "up" | "left" | "diag";
};

export function diffMultilineText(before: string, after: string): DiffLine[] {
  const left = before.split("\n");
  const right = after.split("\n");
  const matrix: Cell[][] = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => ({ length: 0 }))
  );

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      if (left[i - 1] === right[j - 1]) {
        matrix[i][j] = {
          length: matrix[i - 1][j - 1].length + 1,
          prev: "diag"
        };
        continue;
      }

      if (matrix[i - 1][j].length >= matrix[i][j - 1].length) {
        matrix[i][j] = {
          length: matrix[i - 1][j].length,
          prev: "up"
        };
        continue;
      }

      matrix[i][j] = {
        length: matrix[i][j - 1].length,
        prev: "left"
      };
    }
  }

  const lines: DiffLine[] = [];
  let i = left.length;
  let j = right.length;

  while (i > 0 || j > 0) {
    const cell = matrix[i]?.[j];
    if (i > 0 && j > 0 && cell?.prev === "diag" && left[i - 1] === right[j - 1]) {
      lines.push({
        type: "context",
        value: left[i - 1],
        leftNumber: i,
        rightNumber: j
      });
      i -= 1;
      j -= 1;
      continue;
    }

    if (j > 0 && (i === 0 || cell?.prev === "left")) {
      lines.push({
        type: "added",
        value: right[j - 1],
        rightNumber: j
      });
      j -= 1;
      continue;
    }

    if (i > 0) {
      lines.push({
        type: "removed",
        value: left[i - 1],
        leftNumber: i
      });
      i -= 1;
    }
  }

  const normalized = lines.reverse();
  const ordered: DiffLine[] = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];

    if (current?.type === "added" && next?.type === "removed") {
      ordered.push(next, current);
      index += 1;
      continue;
    }

    if (current) {
      ordered.push(current);
    }
  }

  return ordered;
}
