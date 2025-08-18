"use client";

import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ExploreHeaderProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder: string;
  onSearch: (query: string) => void;
}

const ExploreHeader = ({
  title,
  subtitle,
  searchPlaceholder,
  onSearch,
}: ExploreHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Real-time search
    onSearch(value);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && (
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary to-accent bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-accent mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full max-w-4xl mx-auto">
          <div className="relative flex-grow group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors duration-200" />
              <Input
                type="search"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder={searchPlaceholder}
                className="pl-12 pr-4 py-4 h-14 text-lg border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Sparkles className="h-5 w-5 text-slate-400 group-focus-within:text-accent transition-colors duration-200" />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="ml-4 h-14 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 transform hover:scale-105"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </form>

        {/* Search suggestions or quick filters could go here */}
        <div className="flex justify-center mt-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Popular searches:
            </span>
            {["AI", "FinTech", "HealthTech", "SaaS", "E-commerce"].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    onSearch(term);
                  }}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreHeader;
