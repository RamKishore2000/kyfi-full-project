"use client";

import { Check, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SearchFilterBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  filters?: string[];
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
};

export function SearchFilterBar({
  value,
  onChange,
  placeholder,
  filters = ["All", "Green", "Yellow", "Red"],
  selectedFilter = filters[0],
  onFilterChange,
}: SearchFilterBarProps) {
  const handleFilterChange = (filter: string) => {
    onFilterChange?.(filter);
  };

  return (
    <div className="grid w-full gap-3 md:grid-cols-[minmax(240px,1fr)_180px_auto] md:items-center">
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
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full md:w-auto">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {filters.map((item) => (
            <DropdownMenuItem key={item} onSelect={() => handleFilterChange(item)}>
              <Check className={item === selectedFilter ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
              {item}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
