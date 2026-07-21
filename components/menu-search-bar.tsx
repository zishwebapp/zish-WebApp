"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface MenuSearchBarProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  resultCount: number
  className?: string
}

export function MenuSearchBar({ searchTerm, onSearchChange, resultCount, className = "" }: MenuSearchBarProps) {
  const clearSearch = () => {
    onSearchChange("")
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search menu items, categories, or descriptions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 py-3 text-base border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-full"
        />
        {searchTerm && (
          <Button
            id="clearMenuSearchBtn"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {searchTerm && (
        <p className="text-sm text-gray-600 mt-2 text-center animate-fade-in">
          Found {resultCount} item{resultCount !== 1 ? "s" : ""} matching "{searchTerm}"
        </p>
      )}
    </div>
  )
}
