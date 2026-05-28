"use client";

import { useMemo, useState } from "react";

export function useFilter<T>(items: T[], fields: Array<keyof T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      fields.some((field) => String(item[field]).toLowerCase().includes(value)),
    );
  }, [fields, items, query]);

  return { query, setQuery, filtered };
}
