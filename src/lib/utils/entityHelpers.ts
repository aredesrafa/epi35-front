// Utilitários para processamento de entidades
// Helpers genéricos para filtros, busca, ordenação e paginação
// Portados do projeto React original

import type {
  FilterState,
  SearchState,
  SortState,
  PaginationState,
} from "$lib/types";

/**
 * Cria uma função de lookup por ID para uma lista de entidades
 * @param entities - Lista de entidades
 * @returns Função de lookup que retorna a entidade pelo ID
 */
export function createEntityLookup<T extends { id: string }>(entities: T[]) {
  const lookupMap = new Map(entities.map((entity) => [entity.id, entity]));

  return (id: string): T | undefined => {
    return lookupMap.get(id);
  };
}

/**
 * Filtra uma lista de entidades baseado em filtros
 * @param entities - Lista de entidades
 * @param filters - Objeto com filtros a aplicar
 * @returns Lista filtrada
 */
export function filterEntities<T>(entities: T[], filters: FilterState): T[] {
  return entities.filter((entity) => {
    return Object.entries(filters).every(([key, value]) => {
      // Skip filtros vazios ou com valor "todos"/"todas"
      if (!value || value === "todos" || value === "todas" || value === "") {
        return true;
      }

      const entityValue = (entity as any)[key];

      // Comparação exata para strings
      if (typeof value === "string" && typeof entityValue === "string") {
        return entityValue.toLowerCase() === value.toLowerCase();
      }

      // Comparação exata para outros tipos
      return entityValue === value;
    });
  });
}

/**
 * Busca entidades por termo em campos específicos (suporta propriedades aninhadas)
 * @param entities - Lista de entidades
 * @param searchTerm - Termo de busca
 * @param searchFields - Campos onde buscar (ex: ['nome', 'colaborador.nome'])
 * @returns Lista filtrada pela busca
 */
export function searchEntities<T>(
  entities: T[],
  searchTerm: string,
  searchFields: string[],
): T[] {
  if (!searchTerm.trim()) {
    return entities;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  return entities.filter((entity) =>
    searchFields.some((field) => {
      // Suporte para propriedades aninhadas (ex: 'colaborador.nome')
      const fieldValue = field.split(".").reduce((obj: any, key: string) => {
        return obj && obj[key];
      }, entity);

      if (typeof fieldValue === "string") {
        return fieldValue.toLowerCase().includes(lowerSearchTerm);
      }
      if (typeof fieldValue === "number") {
        return fieldValue.toString().includes(lowerSearchTerm);
      }
      return false;
    }),
  );
}

/**
 * Ordena uma lista de entidades
 * @param entities - Lista de entidades
 * @param sortField - Campo para ordenar
 * @param sortDirection - Direção da ordenação
 * @returns Lista ordenada
 */
export function sortEntities<T>(
  entities: T[],
  sortField: keyof T,
  sortDirection: "asc" | "desc",
): T[] {
  if (!sortField) {
    return entities;
  }

  return [...entities].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? 1 : -1;
    if (bValue == null) return sortDirection === "asc" ? -1 : 1;

    // Compare values
    let comparison = 0;

    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      // Convert to string for comparison
      const aStr = String(aValue);
      const bStr = String(bValue);
      comparison = aStr.localeCompare(bStr, "pt-BR");
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

/**
 * Aplica paginação a uma lista de entidades
 * @param entities - Lista de entidades
 * @param currentPage - Página atual (1-indexed)
 * @param itemsPerPage - Itens por página
 * @returns Objeto com itens da página e informações de paginação
 */
export function paginateEntities<T>(
  entities: T[],
  currentPage: number,
  itemsPerPage: number,
): {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  startIndex: number;
  endIndex: number;
} {
  const totalItems = entities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const validPage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const items = entities.slice(startIndex, endIndex);

  return {
    items,
    totalItems,
    totalPages,
    currentPage: validPage,
    hasNext: validPage < totalPages,
    hasPrevious: validPage > 1,
    startIndex,
    endIndex,
  };
}

/**
 * Processa entidades aplicando filtros, busca, ordenação e paginação
 * @param entities - Lista de entidades
 * @param options - Opções de processamento
 * @returns Resultado processado
 */
export function processEntities<T>(
  entities: T[],
  options: {
    filters?: FilterState;
    searchTerm?: string;
    searchFields?: (keyof T)[];
    sortField?: keyof T;
    sortDirection?: "asc" | "desc";
    currentPage?: number;
    itemsPerPage?: number;
  },
): {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  filteredCount: number;
  originalCount: number;
  startIndex: number;
  endIndex: number;
} {
  const {
    filters = {},
    searchTerm = "",
    searchFields = [],
    sortField,
    sortDirection = "asc",
    currentPage = 1,
    itemsPerPage = 10,
  } = options;

  let processedEntities = [...entities];
  const originalCount = processedEntities.length;

  // Apply filters
  if (Object.keys(filters).length > 0) {
    processedEntities = filterEntities(processedEntities, filters);
  }

  // Apply search
  if (searchTerm && searchFields.length > 0) {
    processedEntities = searchEntities(
      processedEntities,
      searchTerm,
      searchFields,
    );
  }

  const filteredCount = processedEntities.length;

  // Apply sorting
  if (sortField) {
    processedEntities = sortEntities(
      processedEntities,
      sortField,
      sortDirection,
    );
  }

  // Apply pagination
  const paginationResult = paginateEntities(
    processedEntities,
    currentPage,
    itemsPerPage,
  );

  return {
    ...paginationResult,
    filteredCount,
    originalCount,
  };
}

/**
 * Cria filtros dinâmicos baseados nos valores únicos de um campo
 * @param entities - Lista de entidades
 * @param field - Campo para extrair valores únicos
 * @returns Array de opções para filtro
 */
export function createFilterOptions<T>(
  entities: T[],
  field: keyof T,
  labelField?: keyof T,
): Array<{ value: string; label: string }> {
  const uniqueValues = new Set<string>();

  entities.forEach((entity) => {
    const value = entity[field];
    if (value != null) {
      uniqueValues.add(String(value));
    }
  });

  const options = Array.from(uniqueValues).map((value) => ({
    value,
    label: labelField
      ? String(
          entities.find((e) => String(e[field]) === value)?.[labelField],
        ) || value
      : value,
  }));

  // Sort options alphabetically
  options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return options;
}

/**
 * Agrupa entidades por um campo específico
 * @param entities - Lista de entidades
 * @param groupField - Campo para agrupar
 * @returns Objeto com grupos
 */
export function groupEntitiesBy<T>(
  entities: T[],
  groupField: keyof T,
): Record<string, T[]> {
  return entities.reduce(
    (groups, entity) => {
      const groupKey = String(entity[groupField] || "Sem categoria");

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(entity);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Calcula estatísticas básicas de uma lista de entidades
 * @param entities - Lista de entidades
 * @param numericField - Campo numérico para calcular estatísticas
 * @returns Estatísticas calculadas
 */
export function calculateEntityStats<T>(
  entities: T[],
  numericField: keyof T,
): {
  total: number;
  count: number;
  average: number;
  min: number;
  max: number;
} {
  const values = entities
    .map((entity) => entity[numericField])
    .filter((value) => typeof value === "number") as number[];

  if (values.length === 0) {
    return { total: 0, count: 0, average: 0, min: 0, max: 0 };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  const count = values.length;
  const average = total / count;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { total, count, average, min, max };
}

/**
 * Valida se uma entidade atende a critérios específicos
 * @param entity - Entidade para validar
 * @param criteria - Critérios de validação
 * @returns true se a entidade atende aos critérios
 */
export function validateEntity<T>(
  entity: T,
  criteria: Partial<Record<keyof T, (value: any) => boolean>>,
): boolean {
  return Object.entries(criteria).every(([field, validator]) => {
    const value = entity[field as keyof T];
    return typeof validator === "function" ? validator(value) : true;
  });
}

/**
 * Encontra entidades duplicadas baseado em campos específicos
 * @param entities - Lista de entidades
 * @param compareFields - Campos para comparar duplicatas
 * @returns Array de grupos de entidades duplicadas
 */
export function findDuplicateEntities<T>(
  entities: T[],
  compareFields: (keyof T)[],
): T[][] {
  const groups = new Map<string, T[]>();

  entities.forEach((entity) => {
    const key = compareFields
      .map((field) => String(entity[field] || ""))
      .join("|");

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(entity);
  });

  // Return only groups with more than one entity (duplicates)
  return Array.from(groups.values()).filter((group) => group.length > 1);
}
