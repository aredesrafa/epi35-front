/**
 * Fichas Stores - Export Index
 */

// Main stores
export { 
  fichasStore, 
  fichasAtivas, 
  fichasPendenteDevolucao, 
  fichasEstats 
} from './fichasStore';

export { 
  fichasFiltersStore, 
  fichasQueryParams, 
  hasActiveFilters, 
  activeFiltersCount, 
  filtersDisplay 
} from './fichasFiltersStore';

export { 
  fichasUIStore, 
  hasSelection, 
  hasMultipleSelection, 
  selectedCount, 
  hasOpenModal, 
  hasOpenDrawer, 
  hasActiveLoading 
} from './fichasUIStore';

export { 
  fichasConfigStore, 
  optionsLoaded, 
  optionsLoading, 
  cacheStatus, 
  dropdownOptions 
} from './fichasConfigStore';