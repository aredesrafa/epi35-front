import { writable, derived, get } from "svelte/store";
import type {
  FilterState,
  SearchState,
  SortState,
  PaginationState,
  EPIFilters,
  EstoqueFilters,
  FichasFilters,
} from "$lib/types/index";

// Store genérico para filtros
export function createFiltersStore<T extends FilterState>(initialFilters: T) {
  const filters = writable<T>(initialFilters);
  const searchTerm = writable("");
  const currentPage = writable(1);
  const itemsPerPage = writable(10);
  const sortField = writable<string>("");
  const sortDirection = writable<"asc" | "desc">("asc");

  // Store derivado que combina todos os estados
  const filtersState = derived(
    [filters, searchTerm, currentPage, itemsPerPage, sortField, sortDirection],
    ([
      $filters,
      $searchTerm,
      $currentPage,
      $itemsPerPage,
      $sortField,
      $sortDirection,
    ]) => ({
      filters: $filters,
      search: {
        term: $searchTerm,
        fields: [], // Será definido pelos componentes que usam
      },
      pagination: {
        currentPage: $currentPage,
        itemsPerPage: $itemsPerPage,
        totalItems: 0, // Será atualizado quando dados forem carregados
        totalPages: 0,
      },
      sort: {
        field: $sortField,
        direction: $sortDirection,
      },
    }),
  );

  return {
    // Subscriptions
    filters,
    searchTerm,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
    filtersState,

    // Actions
    updateFilter: (key: keyof T, value: T[keyof T]) => {
      filters.update((f) => ({ ...f, [key]: value }));
      // Reset página ao filtrar
      currentPage.set(1);
    },

    setSearchTerm: (term: string) => {
      searchTerm.set(term);
      // Reset página ao buscar
      currentPage.set(1);
    },

    setCurrentPage: (page: number) => {
      currentPage.set(page);
    },

    setItemsPerPage: (items: number) => {
      itemsPerPage.set(items);
      currentPage.set(1);
    },

    setSorting: (field: string, direction?: "asc" | "desc") => {
      const currentDirection = get(sortDirection);
      const currentField = get(sortField);

      // Se o campo é o mesmo, alterna direção; senão, usa direção fornecida ou 'asc'
      if (field === currentField && !direction) {
        sortDirection.set(currentDirection === "asc" ? "desc" : "asc");
      } else {
        sortField.set(field);
        sortDirection.set(direction || "asc");
      }
    },

    resetFilters: () => {
      filters.set(initialFilters);
      searchTerm.set("");
      currentPage.set(1);
      sortField.set("");
      sortDirection.set("asc");
    },

    resetPagination: () => {
      currentPage.set(1);
    },

    // Métodos para obter valores atuais
    getCurrentFilters: () => get(filters),
    getCurrentSearchTerm: () => get(searchTerm),
    getCurrentPage: () => get(currentPage),
    getCurrentSort: () => ({
      field: get(sortField),
      direction: get(sortDirection),
    }),
  };
}

// Store específico para filtros de EPIs
export const epiFilters = createFiltersStore<EPIFilters>({
  status: "todos",
  categoria: "todas",
  fabricante: "todos",
});

// Store específico para filtros de estoque
export const estoqueFilters = createFiltersStore<EstoqueFilters>({
  status: "todos",
  estoque: "todos",
  categoria: "todas",
  vencimento: "todos",
});

// Store específico para filtros de fichas
export const fichasFilters = createFiltersStore<FichasFilters>({
  cargo: "todos",
  empresa: "todas",
  devolucaoPendente: false,
});

// Re-export types for convenience
export type { EPIFilters, EstoqueFilters, FichasFilters };

// Helper para criar filtros personalizados rapidamente
export function createCustomFilters<T extends FilterState>(
  initialFilters: T,
  options?: {
    defaultItemsPerPage?: number;
    defaultSortField?: string;
    defaultSortDirection?: "asc" | "desc";
  },
) {
  const store = createFiltersStore(initialFilters);

  // Aplicar opções padrão se fornecidas
  if (options?.defaultItemsPerPage) {
    store.setItemsPerPage(options.defaultItemsPerPage);
  }
  if (options?.defaultSortField) {
    store.setSorting(options.defaultSortField, options.defaultSortDirection);
  }

  return store;
}
