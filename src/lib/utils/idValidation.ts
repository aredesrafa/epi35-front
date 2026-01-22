/**
 * Utilitários de Validação de IDs Customizados
 * 
 * Suporte aos formatos de ID customizados do backend:
 * - Entregas: E + 5 caracteres alfanuméricos (ex: E4U302)
 * - EstoqueItems: I + 5 caracteres alfanuméricos (ex: I7XK91)
 * - TipoEPI: C + 5 caracteres alfanuméricos (ex: C2MN58)
 * - Outros: UUID padrão
 * 
 * Caracteres permitidos: 0-9, A-Z (exceto 0, 1, O, I, L para evitar confusão)
 */

/**
 * Padrões de ID customizados do backend
 */
export const ID_PATTERNS = {
  ENTREGA: /^E[2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z]$/,
  ESTOQUE_ITEM: /^I[2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z]$/,
  TIPO_EPI: /^C[2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z][2-9A-HJ-NP-Z]$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
} as const;

/**
 * Tipos de entidades com IDs customizados
 */
export type EntityType = 'entrega' | 'estoqueItem' | 'tipoEPI' | 'default';

/**
 * Valida ID de entrega (formato: E + 5 caracteres)
 */
export function isValidEntregaId(id: string): boolean {
  return typeof id === 'string' && ID_PATTERNS.ENTREGA.test(id);
}

/**
 * Valida ID de item de estoque (formato: I + 5 caracteres)
 */
export function isValidEstoqueItemId(id: string): boolean {
  return typeof id === 'string' && ID_PATTERNS.ESTOQUE_ITEM.test(id);
}

/**
 * Valida ID de tipo de EPI (formato: C + 5 caracteres)
 */
export function isValidTipoEPIId(id: string): boolean {
  return typeof id === 'string' && ID_PATTERNS.TIPO_EPI.test(id);
}

/**
 * Valida UUID padrão
 */
export function isValidUUID(id: string): boolean {
  return typeof id === 'string' && ID_PATTERNS.UUID.test(id);
}

/**
 * Valida qualquer ID baseado no tipo de entidade
 */
export function isValidEntityId(id: string, entityType: EntityType = 'default'): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Para IDs customizados, validar formato específico
  switch (entityType) {
    case 'entrega':
      return isValidEntregaId(id) || isValidUUID(id); // Aceita ambos para compatibilidade
    case 'estoqueItem':
      return isValidEstoqueItemId(id) || isValidUUID(id); // Aceita ambos para compatibilidade
    case 'tipoEPI':
      return isValidTipoEPIId(id) || isValidUUID(id); // Aceita ambos para compatibilidade
    default:
      return isValidUUID(id);
  }
}

/**
 * Detecta automaticamente o tipo de ID baseado no prefixo
 */
export function detectEntityType(id: string): EntityType {
  if (!id || typeof id !== 'string') {
    return 'default';
  }

  const firstChar = id.charAt(0).toUpperCase();
  
  switch (firstChar) {
    case 'E':
      return isValidEntregaId(id) ? 'entrega' : 'default';
    case 'I':
      return isValidEstoqueItemId(id) ? 'estoqueItem' : 'default';
    case 'C':
      return isValidTipoEPIId(id) ? 'tipoEPI' : 'default';
    default:
      return 'default';
  }
}

/**
 * Valida múltiplos IDs de uma vez
 */
export function validateIds(ids: string[], entityType: EntityType = 'default'): { valid: string[], invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  ids.forEach(id => {
    if (isValidEntityId(id, entityType)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  });

  return { valid, invalid };
}

/**
 * Normaliza ID para formato padrão (maiúsculas)
 */
export function normalizeId(id: string): string {
  if (!id || typeof id !== 'string') {
    return id;
  }

  // Se for UUID, manter em minúsculas
  if (isValidUUID(id)) {
    return id.toLowerCase();
  }

  // Se for ID customizado, converter para maiúsculas
  return id.toUpperCase();
}

/**
 * Gera mensagem de erro apropriada para ID inválido
 */
export function getIdErrorMessage(id: string, entityType: EntityType = 'default'): string {
  if (!id) {
    return 'ID é obrigatório';
  }

  const typeMessages = {
    entrega: 'ID de entrega deve ter formato E + 5 caracteres (ex: E4U302)',
    estoqueItem: 'ID de item de estoque deve ter formato I + 5 caracteres (ex: I7XK91)',
    tipoEPI: 'ID de tipo de EPI deve ter formato C + 5 caracteres (ex: C2MN58)',
    default: 'ID deve ser um UUID válido'
  };

  return typeMessages[entityType] || 'ID inválido';
}

/**
 * Utilitário para formulários - valida ID e retorna erro se inválido
 */
export function validateIdField(id: string, entityType: EntityType = 'default'): string | null {
  if (!isValidEntityId(id, entityType)) {
    return getIdErrorMessage(id, entityType);
  }
  return null;
}

/**
 * Verifica se uma string parece ser um ID customizado (tem prefixo)
 */
export function isCustomId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  const firstChar = id.charAt(0).toUpperCase();
  return ['E', 'I', 'C'].includes(firstChar) && id.length === 6;
}

/**
 * Verifica se uma string parece ser um UUID
 */
export function isUUIDFormat(id: string): boolean {
  return isValidUUID(id);
}

/**
 * Converte ID antigo para novo formato (se necessário)
 * Esta função pode ser usada durante migração de dados
 */
export function migrateIdFormat(id: string, entityType: EntityType): string {
  // Se já está no formato correto, retornar como está
  if (isValidEntityId(id, entityType)) {
    return normalizeId(id);
  }

  // Se é UUID e queremos formato customizado, manter UUID por compatibilidade
  if (isValidUUID(id)) {
    return id.toLowerCase();
  }

  // Caso contrário, retornar como está e deixar o backend lidar
  return id;
}

/**
 * Constantes para validação de formulários
 */
export const ID_VALIDATION_RULES = {
  ENTREGA: {
    required: true,
    validator: isValidEntregaId,
    message: 'ID de entrega inválido (formato: E + 5 caracteres)'
  },
  ESTOQUE_ITEM: {
    required: true,
    validator: isValidEstoqueItemId,
    message: 'ID de item de estoque inválido (formato: I + 5 caracteres)'
  },
  TIPO_EPI: {
    required: true,
    validator: isValidTipoEPIId,
    message: 'ID de tipo de EPI inválido (formato: C + 5 caracteres)'
  },
  UUID: {
    required: true,
    validator: isValidUUID,
    message: 'UUID inválido'
  }
} as const;

/**
 * Regex para remover caracteres não permitidos em IDs customizados
 */
export const ALLOWED_CHARS_REGEX = /[^2-9A-HJ-NP-Z]/g;

/**
 * Sanitiza entrada para ID customizado
 */
export function sanitizeCustomId(input: string, prefix: 'E' | 'I' | 'C'): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remover o prefixo se já existir
  const withoutPrefix = input.replace(new RegExp(`^${prefix}`, 'i'), '');
  
  // Remover caracteres não permitidos e converter para maiúsculas
  const sanitized = withoutPrefix.toUpperCase().replace(ALLOWED_CHARS_REGEX, '');
  
  // Limitar a 5 caracteres
  const truncated = sanitized.substring(0, 5);
  
  return truncated;
}

/**
 * Formata ID customizado com prefixo
 */
export function formatCustomId(input: string, prefix: 'E' | 'I' | 'C'): string {
  const sanitized = sanitizeCustomId(input, prefix);
  return sanitized ? `${prefix}${sanitized}` : '';
}