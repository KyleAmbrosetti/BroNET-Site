import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AddressSuggestion = {
  displayName: string;
  address: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  locationId?: string;
};

interface AddressSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onSearch?: () => void;
  placeholder?: string;
  buttonText?: string;
  isSearching?: boolean;
  showButton?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  inputId?: string;
}

export function AddressSearch({
  value,
  onChange,
  onSelect,
  onSearch,
  placeholder = "Enter your street address...",
  buttonText = "Check Address",
  isSearching = false,
  showButton = true,
  className,
  inputClassName,
  buttonClassName,
  disabled = false,
  autoFocus = false,
  inputId = "address-search",
}: AddressSearchProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/coverage/suggest?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      const newSuggestions = data.suggestions || [];
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    onSelect?.(suggestion);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSearch?.();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          setShowSuggestions(false);
          onSearch?.();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearInput = () => {
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            id={inputId}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className={cn("pl-10 pr-10 h-12", inputClassName)}
            disabled={disabled || isSearching}
            autoFocus={autoFocus}
            autoComplete="off"
            data-testid="input-address-search"
          />
          {value && !isSearching && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-address"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isLoadingSuggestions && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {showButton && (
          <Button
            onClick={onSearch}
            disabled={disabled || isSearching || !value.trim()}
            className={cn("h-12 px-6 bg-gradient-brand border-0", buttonClassName)}
            data-testid="button-address-search"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {buttonText}
              </>
            )}
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto" role="listbox">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  "px-4 py-3 cursor-pointer transition-colors flex items-start gap-3",
                  selectedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => selectSuggestion(suggestion)}
                data-testid={`suggestion-${index}`}
              >
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{suggestion.address}</div>
                  {suggestion.suburb && (
                    <div className="text-sm text-muted-foreground">
                      {suggestion.suburb}
                      {suggestion.state && `, ${suggestion.state}`}
                      {suggestion.postcode && ` ${suggestion.postcode}`}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground">
            Use arrow keys to navigate, Enter to select
          </div>
        </div>
      )}
    </div>
  );
}