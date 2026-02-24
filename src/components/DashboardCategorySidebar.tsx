"use client";

import { FolderOpen, Banknote, Truck, Scale, FileStack, Folder } from "lucide-react";
import type { DocumentCategory } from "@/types";

const TEAL = "#22d3ee";
const FOLDERS: { id: DocumentCategory | "all"; label: string; icon: typeof FolderOpen }[] = [
  { id: "all", label: "All", icon: FolderOpen },
  { id: "Financial", label: "Financial", icon: Banknote },
  { id: "Logistics", label: "Logistics", icon: Truck },
  { id: "Legal", label: "Legal", icon: Scale },
  { id: "General", label: "General", icon: FileStack },
];

export type FolderId = DocumentCategory | "all" | string;

type DashboardCategorySidebarProps = {
  selectedId: FolderId;
  onSelect: (id: FolderId) => void;
  customCategories: string[];
  documentCounts: Record<string, number>;
};

export function DashboardCategorySidebar({
  selectedId,
  onSelect,
  customCategories,
  documentCounts,
}: DashboardCategorySidebarProps) {
  return (
    <aside
      className="rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 backdrop-blur-xl p-4 min-w-[180px] h-fit sticky top-24 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
      aria-label="Industry folders"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 px-2">
        Industry
      </p>
      <nav className="flex flex-col gap-1">
        {FOLDERS.map(({ id, label, icon: Icon }) => {
          const count = id === "all" ? documentCounts.all : documentCounts[id] ?? 0;
          const isSelected = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all w-full ${
                isSelected
                  ? "bg-[#22d3ee]/20 text-[#22d3ee] border border-[#22d3ee]/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="flex-1 truncate">{label}</span>
              <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                {count}
              </span>
            </button>
          );
        })}
        {customCategories.length > 0 && (
          <>
            <div className="my-2 border-t border-white/10" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 px-2">
              Custom
            </p>
            {customCategories.map((name) => {
              const count = documentCounts[name] ?? 0;
              const isSelected = selectedId === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelect(name)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all w-full ${
                    isSelected
                      ? "bg-[#22d3ee]/20 text-[#22d3ee] border border-[#22d3ee]/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Folder className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1 truncate">{name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
