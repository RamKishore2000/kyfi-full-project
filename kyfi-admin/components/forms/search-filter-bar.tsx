"use client";

import { Check, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminLanguage } from "@/components/admin-language-provider";

type SearchFilterBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  filters?: string[];
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
  showFiltersButton?: boolean;
};

export function SearchFilterBar({
  value,
  onChange,
  placeholder,
  filters = ["All", "Green", "Yellow", "Red"],
  selectedFilter = filters[0],
  onFilterChange,
  showFiltersButton = true,
}: SearchFilterBarProps) {
  const { t } = useAdminLanguage();
  const labelFor = (item: string) => {
    if (item === "All") return t("common.all");
    if (item === "Pending") return t("table.pending");
    if (item === "Approved") return t("table.approved");
    if (item === "Rejected") return t("table.rejected");
    if (item === "Suspended") return t("table.suspended");
    if (item === "Green") return t("badges.green");
    if (item === "Yellow") return t("badges.yellow");
    if (item === "Red") return t("badges.red");
    if (item === "GREEN + Blacklisted") return `GREEN + ${t("badges.blacklisted")}`;
    if (item === "YELLOW + Blacklisted") return `YELLOW + ${t("badges.blacklisted")}`;
    if (item === "RED + Blacklisted") return `RED + ${t("badges.blacklisted")}`;
    return item;
  };
  const handleFilterChange = (filter: string) => {
    onFilterChange?.(filter);
  };

  return (
    <div
      className={[
        "grid w-full gap-3 md:items-center",
        showFiltersButton ? "md:grid-cols-[minmax(240px,1fr)_180px_auto]" : "md:grid-cols-[minmax(240px,1fr)_180px]",
      ].join(" ")}
    >
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
      <Select value={selectedFilter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filters.map((item) => (
            <SelectItem key={item} value={item}>
              {labelFor(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showFiltersButton ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <SlidersHorizontal className="h-4 w-4" />
              {t("common.filters")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            {filters.map((item) => (
              <DropdownMenuItem key={item} onSelect={() => handleFilterChange(item)}>
                <Check className={item === selectedFilter ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
                {labelFor(item)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
