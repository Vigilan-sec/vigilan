"use client";

import { type ReactNode } from "react";

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-700/50">
      <table className="w-full text-sm text-left">
        <thead className="sticky top-0 z-10 bg-zinc-800 text-xs uppercase text-zinc-400 border-b border-zinc-700/50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-medium whitespace-nowrap ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-700/30">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`bg-zinc-900/50 transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-zinc-700/40"
                    : "hover:bg-zinc-800/60"
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3 whitespace-nowrap ${col.className ?? ""}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(getNestedValue(row, String(col.accessor)) ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
