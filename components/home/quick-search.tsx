"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  X,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  Bird,
  Heart,
  Egg,
  Utensils,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Eye,
  Download,
  Calculator,
  Target,
  PieChart,
  LineChart,
  Database,
  Calendar,
  UserPlus,
  Activity
} from "lucide-react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  icon: any;
  type: "page" | "action" | "feature";
}

interface QuickSearchProps {
  onResultSelect?: (result: SearchResult) => void;
}

export function QuickSearch({ onResultSelect }: QuickSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults: SearchResult[] = [
    // Flock Management
    { id: "add-flock", title: "Add New Flock", description: "Register a new flock batch", category: "Flock Management", href: "/flocks", icon: Bird, type: "action" },
    { id: "view-flocks", title: "View All Flocks", description: "Manage existing flocks", category: "Flock Management", href: "/flocks", icon: Eye, type: "page" },
    { id: "flock-analytics", title: "Flock Analytics", description: "View flock performance metrics", category: "Flock Management", href: "/flocks?tab=analytics", icon: BarChart3, type: "page" },
    
    // Health & Veterinary
    { id: "record-vaccination", title: "Record Vaccination", description: "Log vaccination details", category: "Health & Veterinary", href: "/health", icon: Heart, type: "action" },
    { id: "mortality-record", title: "Mortality Record", description: "Record bird deaths", category: "Health & Veterinary", href: "/health?tab=mortality", icon: Heart, type: "action" },
    
    // Production Management
    { id: "record-production", title: "Record Egg Production", description: "Log daily egg production", category: "Production Management", href: "/production", icon: Egg, type: "action" },
    { id: "production-analytics", title: "Production Analytics", description: "View production insights", category: "Production Management", href: "/production?tab=analytics", icon: TrendingUp, type: "page" },
    { id: "quality-assessment", title: "Quality Assessment", description: "Assess egg quality grades", category: "Production Management", href: "/production", icon: Target, type: "action" },
    
    // Feed Management
    { id: "add-feed-inventory", title: "Add Feed Inventory", description: "Update feed stock levels", category: "Feed Management", href: "/feed", icon: Utensils, type: "action" },
    { id: "feed-analytics", title: "Feed Analytics", description: "Analyze feed costs and usage", category: "Feed Management", href: "/feed?tab=analytics", icon: PieChart, type: "page" },
    { id: "feed-usage", title: "Feed Usage Tracking", description: "Track daily feed consumption", category: "Feed Management", href: "/feed?tab=usage", icon: Calculator, type: "page" },
    
    // Financial Management
    { id: "add-expense", title: "Add Expense", description: "Record farm expenses", category: "Financial Management", href: "/financial", icon: DollarSign, type: "action" },
    { id: "record-revenue", title: "Record Revenue", description: "Log income from sales", category: "Financial Management", href: "/financial", icon: DollarSign, type: "action" },
    { id: "financial-reports", title: "Financial Reports", description: "Generate financial reports", category: "Financial Management", href: "/reports?tab=financial", icon: FileText, type: "page" },
    
    // Staff Management
    { id: "add-staff", title: "Add Staff Member", description: "Register new staff member", category: "Staff Management", href: "/staff", icon: UserPlus, type: "action" },
    { id: "attendance", title: "Check Attendance", description: "View staff attendance records", category: "Staff Management", href: "/staff?tab=attendance", icon: Clock, type: "page" },
    { id: "payroll", title: "Process Payroll", description: "Manage staff payroll", category: "Staff Management", href: "/staff?tab=payroll", icon: Calculator, type: "page" },
    
    // Reports & Analytics
    { id: "comprehensive-reports", title: "Comprehensive Reports", description: "Generate all system reports", category: "Reports & Analytics", href: "/reports", icon: BarChart3, type: "page" },
    { id: "export-data", title: "Export Data", description: "Export data to CSV/PDF", category: "Reports & Analytics", href: "/reports", icon: Download, type: "action" },
    { id: "system-analytics", title: "System Analytics", description: "View system-wide analytics", category: "Reports & Analytics", href: "/reports", icon: PieChart, type: "page" },
  ];

  const filteredResults = searchResults.filter(result =>
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description.toLowerCase().includes(query.toLowerCase()) ||
    result.category.toLowerCase().includes(query.toLowerCase())
  );

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setOpen(false);
    
    // Add to recent searches
    const newRecent = [result.title, ...recentSearches.filter(item => item !== result.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    onResultSelect?.(result);
    router.push(result.href);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "action":
        return <ArrowRight className="h-3 w-3" />;
      case "page":
        return <Eye className="h-3 w-3" />;
      case "feature":
        return <Settings className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "action":
        return "bg-blue-100 text-blue-800";
      case "page":
        return "bg-green-100 text-green-800";
      case "feature":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            placeholder="Search features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-10 w-64"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search features..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query === "" && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      const result = searchResults.find(r => r.title === search);
                      if (result) handleSelect(result);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRecent = recentSearches.filter((_, i) => i !== index);
                        setRecentSearches(newRecent);
                        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
                <CommandItem onSelect={clearRecent} className="text-muted-foreground">
                  Clear recent searches
                </CommandItem>
              </CommandGroup>
            )}
            
            {query !== "" && Object.keys(groupedResults).length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            
            {query !== "" && Object.entries(groupedResults).map(([category, results]) => (
              <CommandGroup key={category} heading={category}>
                {results.map((result) => {
                  const Icon = result.icon;
                  return (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center space-x-3"
                    >
                      <div className="p-1 rounded bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge variant="outline" className={cn("text-xs", getTypeColor(result.type))}>
                            {getTypeIcon(result.type)}
                            <span className="ml-1">{result.type}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
