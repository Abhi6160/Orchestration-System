import { Fragment, type ReactNode } from "react";

/**
 * Tiny renderer for the subset of markdown used by the simulated model
 * responses: headings-as-bold lines, bullets, simple tables and **bold**.
 * A real integration would swap this for a full markdown pipeline.
 */

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.8em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const cells = (row: string) =>
  row
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());

export function Markdownish({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const table: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        table.push(lines[i] ?? "");
        i++;
      }
      const header = cells(table[0] ?? "");
      const body = table.slice(2).map(cells);
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2">
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 font-medium text-muted-foreground">
                    {inline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-t border-border">
                  {row.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 align-top">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line.trim().startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("- ")) {
        items.push((lines[i] ?? "").trim().slice(2));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-2 space-y-1.5">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-muted-foreground">
              <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-primary" />
              <span>{inline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    blocks.push(
      <p key={key++} className="my-2 text-muted-foreground first:mt-0 last:mb-0">
        {inline(line)}
      </p>,
    );
    i++;
  }

  return <div className="text-sm leading-relaxed">{blocks}</div>;
}
