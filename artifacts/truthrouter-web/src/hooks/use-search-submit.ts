import { useState } from 'react';
import { useLocation } from 'wouter';

export function useSearchSubmit() {
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setLocation(`/review?q=${encodeURIComponent(query.trim())}`);
  };

  return { handleSearch };
}
