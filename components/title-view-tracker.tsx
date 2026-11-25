"use client";

import { useEffect } from "react";

export default function TitleViewTracker({ id }: { id: number }) {
  useEffect(() => {
    try {
      const key = "watchora-recently-viewed";
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [id, ...current.filter((value: number) => value !== id)].slice(0, 12);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Discovery history is optional; the title page remains fully usable.
    }
  }, [id]);

  return null;
}
