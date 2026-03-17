"use client";

import { useEffect, useState } from "react";

type Section = { id: string; title: string };

export function LearnPageNav({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const updateActive = () => {
      const scrollY = window.scrollY + 120;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) current = id;
      }
      setActiveId(current ?? ids[0]);
    };
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => window.removeEventListener("scroll", updateActive);
  }, [sections]);

  return (
    <nav
      aria-label="Learn page sections"
      className="sticky top-24 hidden w-52 shrink-0 lg:block"
    >
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3 [.light_&]:border-slate-200/60 [.light_&]:bg-slate-100/80">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 [.light_&]:text-slate-600">
          On this page
        </p>
        <ul className="space-y-0.5" role="list">
          {sections.map(({ id, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block rounded-lg px-3 py-2 text-sm transition [.light_&]:hover:bg-slate-200/80 ${
                  activeId === id
                    ? "bg-blue-600/20 font-medium text-blue-400 [.light_&]:bg-blue-100 [.light_&]:text-blue-700"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 [.light_&]:text-slate-600 [.light_&]:hover:text-slate-900"
                }`}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
