/**
 * Performance utilities for Svelte 4 applications
 * Otimizações específicas para Flowbite Svelte v0.48.6
 */

import {
  writable,
  derived,
  readable,
  type Readable,
  type Writable,
} from "svelte/store";

/**
 * Debounce function para otimizar inputs de busca
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function para otimizar scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * Lazy loading store para componentes pesados
 */
export function createLazyStore<T>(
  loader: () => Promise<T>,
  defaultValue: T,
): Readable<{ data: T; loading: boolean; error: string | null }> {
  return readable(
    { data: defaultValue, loading: false, error: null },
    (set) => {
      let loaded = false;

      const loadData = () => {
        if (!loaded) {
          loaded = true;
          set({ data: defaultValue, loading: true, error: null });

          loader()
            .then((data) => set({ data, loading: false, error: null }))
            .catch((error) =>
              set({
                data: defaultValue,
                loading: false,
                error: error.message || "Erro ao carregar dados",
              }),
            );
        }
      };

      // Load data immediately
      loadData();

      return () => {
        // Cleanup function
      };
    },
  );
}

/**
 * Memoization para computações custosas
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Store otimizado para paginação
 */
export function createPaginationStore(itemsPerPage: number = 10) {
  const currentPage = writable(1);
  const totalItems = writable(0);

  const totalPages = derived(totalItems, ($totalItems) =>
    Math.ceil($totalItems / itemsPerPage),
  );

  const hasNext = derived(
    [currentPage, totalPages],
    ([$currentPage, $totalPages]) => $currentPage < $totalPages,
  );

  const hasPrev = derived(currentPage, ($currentPage) => $currentPage > 1);

  const startIndex = derived(
    currentPage,
    ($currentPage) => ($currentPage - 1) * itemsPerPage,
  );

  const endIndex = derived(
    [currentPage, totalItems],
    ([$currentPage, $totalItems]) =>
      Math.min($currentPage * itemsPerPage, $totalItems),
  );

  return {
    currentPage,
    totalItems,
    totalPages: { subscribe: totalPages.subscribe },
    hasNext: { subscribe: hasNext.subscribe },
    hasPrev: { subscribe: hasPrev.subscribe },
    startIndex: { subscribe: startIndex.subscribe },
    endIndex: { subscribe: endIndex.subscribe },
    goToPage: (page: number) => currentPage.set(page),
    nextPage: () => currentPage.update((p) => p + 1),
    prevPage: () => currentPage.update((p) => Math.max(1, p - 1)),
    reset: () => currentPage.set(1),
  };
}

/**
 * Store para filtros otimizados
 */
export function createOptimizedFiltersStore<T extends Record<string, any>>(
  initialFilters: T,
  debounceDelay: number = 300,
) {
  const filters = writable(initialFilters);
  const searchTerm = writable("");

  // Debounced search term para otimização
  const debouncedSearchTerm = derived(
    searchTerm,
    ($searchTerm, set) => {
      const timer = setTimeout(() => set($searchTerm), debounceDelay);
      return () => clearTimeout(timer);
    },
    "",
  );

  return {
    filters: { subscribe: filters.subscribe },
    searchTerm: { subscribe: searchTerm.subscribe },
    debouncedSearchTerm: { subscribe: debouncedSearchTerm.subscribe },
    updateFilter: <K extends keyof T>(key: K, value: T[K]) =>
      filters.update((f) => ({ ...f, [key]: value })),
    setSearchTerm: (term: string) => searchTerm.set(term),
    resetFilters: () => {
      filters.set(initialFilters);
      searchTerm.set("");
    },
  };
}

/**
 * Intersection Observer para lazy loading de componentes
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {},
) {
  if (typeof window === "undefined") {
    return { observe: () => {}, disconnect: () => {} };
  }

  const observer = new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: "50px",
    ...options,
  });

  return {
    observe: (element: Element) => observer.observe(element),
    disconnect: () => observer.disconnect(),
  };
}

/**
 * Store para cache otimizado
 */
export function createCacheStore<T>(ttl: number = 5 * 60 * 1000) {
  // 5 minutos default
  const cache = new Map<string, { data: T; timestamp: number }>();

  return {
    get: (key: string): T | null => {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() - item.timestamp > ttl) {
        cache.delete(key);
        return null;
      }

      return item.data;
    },
    set: (key: string, data: T) => {
      cache.set(key, { data, timestamp: Date.now() });
    },
    clear: () => cache.clear(),
    delete: (key: string) => cache.delete(key),
  };
}

/**
 * Hook para detectar mudanças de viewport
 */
export function createViewportStore() {
  if (typeof window === "undefined") {
    return readable({ width: 1024, height: 768, isMobile: false });
  }

  return readable(
    {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
    },
    (set) => {
      const updateViewport = throttle(() => {
        set({
          width: window.innerWidth,
          height: window.innerHeight,
          isMobile: window.innerWidth < 768,
        });
      }, 100);

      window.addEventListener("resize", updateViewport);
      return () => window.removeEventListener("resize", updateViewport);
    },
  );
}
