/**
 * Validação de Formulários
 * 
 * Utilitários para validação de formulários com suporte aos IDs customizados
 * e regras de negócio específicas do sistema EPI
 */

import { isValidEntityId, type EntityType } from './idValidation';
import { isValidCPF, isValidCNPJ, isValidEmail } from './validation';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida formulário de colaborador
 */
export function validateColaboradorForm(data: {
  nome: string;
  cpf: string;
  contratadaId: string;
  unidadeNegocioId: string;
  matricula: string;
  cargo: string;
  setor: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Nome obrigatório
  if (!data.nome?.trim()) {
    errors.push({ field: 'nome', message: 'Nome é obrigatório' });
  } else if (data.nome.trim().length < 3) {
    errors.push({ field: 'nome', message: 'Nome deve ter pelo menos 3 caracteres' });
  }

  // CPF obrigatório e válido
  if (!data.cpf?.trim()) {
    errors.push({ field: 'cpf', message: 'CPF é obrigatório' });
  } else if (!isValidCPF(data.cpf)) {
    errors.push({ field: 'cpf', message: 'CPF inválido' });
  }

  // Unidade de negócio obrigatória
  if (!data.unidadeNegocioId?.trim()) {
    errors.push({ field: 'unidadeNegocioId', message: 'Unidade de negócio é obrigatória' });
  } else if (!isValidEntityId(data.unidadeNegocioId, 'default')) {
    errors.push({ field: 'unidadeNegocioId', message: 'ID da unidade de negócio inválido' });
  }

  // Contratada obrigatória
  if (!data.contratadaId?.trim()) {
    errors.push({ field: 'contratadaId', message: 'Contratada é obrigatória' });
  } else if (!isValidEntityId(data.contratadaId, 'default')) {
    errors.push({ field: 'contratadaId', message: 'ID da contratada inválido' });
  }

  // Matrícula obrigatória
  if (!data.matricula?.trim()) {
    errors.push({ field: 'matricula', message: 'Matrícula é obrigatória' });
  }

  // Cargo obrigatório
  if (!data.cargo?.trim()) {
    errors.push({ field: 'cargo', message: 'Cargo é obrigatório' });
  }

  // Setor obrigatório
  if (!data.setor?.trim()) {
    errors.push({ field: 'setor', message: 'Setor é obrigatório' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formulário de contratada
 */
export function validateContratadaForm(data: {
  nome: string;
  cnpj: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Nome obrigatório
  if (!data.nome?.trim()) {
    errors.push({ field: 'nome', message: 'Nome é obrigatório' });
  } else if (data.nome.trim().length < 3) {
    errors.push({ field: 'nome', message: 'Nome deve ter pelo menos 3 caracteres' });
  }

  // CNPJ obrigatório e válido
  if (!data.cnpj?.trim()) {
    errors.push({ field: 'cnpj', message: 'CNPJ é obrigatório' });
  } else if (!isValidCNPJ(data.cnpj)) {
    errors.push({ field: 'cnpj', message: 'CNPJ inválido' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formulário de tipo de EPI
 */
export function validateTipoEPIForm(data: {
  nomeEquipamento: string;
  numeroCa: string;
  categoria: string;
  descricao?: string;
  vidaUtilDias?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Nome do equipamento obrigatório
  if (!data.nomeEquipamento?.trim()) {
    errors.push({ field: 'nomeEquipamento', message: 'Nome do equipamento é obrigatório' });
  } else if (data.nomeEquipamento.trim().length < 3) {
    errors.push({ field: 'nomeEquipamento', message: 'Nome do equipamento deve ter pelo menos 3 caracteres' });
  }

  // Número CA obrigatório
  if (!data.numeroCa?.trim()) {
    errors.push({ field: 'numeroCa', message: 'Número CA é obrigatório' });
  } else if (!/^CA-\d+$/.test(data.numeroCa.trim())) {
    errors.push({ field: 'numeroCa', message: 'Número CA deve ter formato CA-XXXXX' });
  }

  // Categoria obrigatória
  if (!data.categoria?.trim()) {
    errors.push({ field: 'categoria', message: 'Categoria é obrigatória' });
  }

  // Vida útil em dias (opcional, mas se informada deve ser positiva)
  if (data.vidaUtilDias !== undefined && data.vidaUtilDias !== null) {
    if (data.vidaUtilDias <= 0) {
      errors.push({ field: 'vidaUtilDias', message: 'Vida útil deve ser maior que zero' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formulário de entrega
 */
export function validateEntregaForm(data: {
  fichaEpiId: string;
  itens: Array<{
    estoqueItemOrigemId: string;
    numeroSerie?: string;
  }>;
  usuarioId: string;
  observacoes?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Ficha EPI obrigatória
  if (!data.fichaEpiId?.trim()) {
    errors.push({ field: 'fichaEpiId', message: 'Ficha EPI é obrigatória' });
  } else if (!isValidEntityId(data.fichaEpiId, 'default')) {
    errors.push({ field: 'fichaEpiId', message: 'ID da ficha EPI inválido' });
  }

  // Usuário obrigatório
  if (!data.usuarioId?.trim()) {
    errors.push({ field: 'usuarioId', message: 'Usuário é obrigatório' });
  } else if (!isValidEntityId(data.usuarioId, 'default')) {
    errors.push({ field: 'usuarioId', message: 'ID do usuário inválido' });
  }

  // Itens obrigatórios
  if (!data.itens || data.itens.length === 0) {
    errors.push({ field: 'itens', message: 'Pelo menos um item deve ser informado' });
  } else {
    data.itens.forEach((item, index) => {
      if (!item.estoqueItemOrigemId?.trim()) {
        errors.push({ 
          field: `itens[${index}].estoqueItemOrigemId`, 
          message: 'Item de estoque é obrigatório' 
        });
      } else if (!isValidEntityId(item.estoqueItemOrigemId, 'estoqueItem')) {
        errors.push({ 
          field: `itens[${index}].estoqueItemOrigemId`, 
          message: 'ID do item de estoque inválido' 
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formulário de devolução
 */
export function validateDevolucaoForm(data: {
  fichaId: string;
  entregaId: string;
  itensParaDevolucao: Array<{
    itemId: string;
    motivoDevolucao: string;
    destinoItem?: string;
  }>;
  usuarioId: string;
  observacoes?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Ficha obrigatória
  if (!data.fichaId?.trim()) {
    errors.push({ field: 'fichaId', message: 'Ficha é obrigatória' });
  } else if (!isValidEntityId(data.fichaId, 'default')) {
    errors.push({ field: 'fichaId', message: 'ID da ficha inválido' });
  }

  // Entrega obrigatória
  if (!data.entregaId?.trim()) {
    errors.push({ field: 'entregaId', message: 'Entrega é obrigatória' });
  } else if (!isValidEntityId(data.entregaId, 'entrega')) {
    errors.push({ field: 'entregaId', message: 'ID da entrega inválido' });
  }

  // Usuário obrigatório
  if (!data.usuarioId?.trim()) {
    errors.push({ field: 'usuarioId', message: 'Usuário é obrigatório' });
  } else if (!isValidEntityId(data.usuarioId, 'default')) {
    errors.push({ field: 'usuarioId', message: 'ID do usuário inválido' });
  }

  // Itens para devolução obrigatórios
  if (!data.itensParaDevolucao || data.itensParaDevolucao.length === 0) {
    errors.push({ field: 'itensParaDevolucao', message: 'Pelo menos um item deve ser devolvido' });
  } else {
    data.itensParaDevolucao.forEach((item, index) => {
      if (!item.itemId?.trim()) {
        errors.push({ 
          field: `itensParaDevolucao[${index}].itemId`, 
          message: 'Item é obrigatório' 
        });
      } else if (!isValidEntityId(item.itemId, 'default')) {
        errors.push({ 
          field: `itensParaDevolucao[${index}].itemId`, 
          message: 'ID do item inválido' 
        });
      }

      if (!item.motivoDevolucao?.trim()) {
        errors.push({ 
          field: `itensParaDevolucao[${index}].motivoDevolucao`, 
          message: 'Motivo da devolução é obrigatório' 
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formulário de nota de movimentação
 */
export function validateNotaMovimentacaoForm(data: {
  tipo: string;
  almoxarifadoDestinoId?: string;
  almoxarifadoOrigemId?: string;
  observacoes?: string;
  itens?: Array<{
    tipoEpiId: string;
    quantidade: number;
    custoUnitario?: number;
  }>;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Tipo obrigatório
  if (!data.tipo?.trim()) {
    errors.push({ field: 'tipo', message: 'Tipo da nota é obrigatório' });
  }

  // Validações específicas por tipo
  switch (data.tipo) {
    case 'ENTRADA':
      if (!data.almoxarifadoDestinoId?.trim()) {
        errors.push({ field: 'almoxarifadoDestinoId', message: 'Almoxarifado de destino é obrigatório para entrada' });
      } else if (!isValidEntityId(data.almoxarifadoDestinoId, 'default')) {
        errors.push({ field: 'almoxarifadoDestinoId', message: 'ID do almoxarifado de destino inválido' });
      }
      break;

    case 'TRANSFERENCIA':
      if (!data.almoxarifadoOrigemId?.trim()) {
        errors.push({ field: 'almoxarifadoOrigemId', message: 'Almoxarifado de origem é obrigatório para transferência' });
      } else if (!isValidEntityId(data.almoxarifadoOrigemId, 'default')) {
        errors.push({ field: 'almoxarifadoOrigemId', message: 'ID do almoxarifado de origem inválido' });
      }

      if (!data.almoxarifadoDestinoId?.trim()) {
        errors.push({ field: 'almoxarifadoDestinoId', message: 'Almoxarifado de destino é obrigatório para transferência' });
      } else if (!isValidEntityId(data.almoxarifadoDestinoId, 'default')) {
        errors.push({ field: 'almoxarifadoDestinoId', message: 'ID do almoxarifado de destino inválido' });
      }
      break;

    case 'DESCARTE':
      if (!data.almoxarifadoOrigemId?.trim()) {
        errors.push({ field: 'almoxarifadoOrigemId', message: 'Almoxarifado de origem é obrigatório para descarte' });
      } else if (!isValidEntityId(data.almoxarifadoOrigemId, 'default')) {
        errors.push({ field: 'almoxarifadoOrigemId', message: 'ID do almoxarifado de origem inválido' });
      }
      break;
  }

  // Validar itens se fornecidos
  if (data.itens && data.itens.length > 0) {
    data.itens.forEach((item, index) => {
      if (!item.tipoEpiId?.trim()) {
        errors.push({ 
          field: `itens[${index}].tipoEpiId`, 
          message: 'Tipo de EPI é obrigatório' 
        });
      } else if (!isValidEntityId(item.tipoEpiId, 'tipoEPI')) {
        errors.push({ 
          field: `itens[${index}].tipoEpiId`, 
          message: 'ID do tipo de EPI inválido' 
        });
      }

      if (!item.quantidade || item.quantidade <= 0) {
        errors.push({ 
          field: `itens[${index}].quantidade`, 
          message: 'Quantidade deve ser maior que zero' 
        });
      }

      if (item.custoUnitario !== undefined && item.custoUnitario !== null && item.custoUnitario < 0) {
        errors.push({ 
          field: `itens[${index}].custoUnitario`, 
          message: 'Custo unitário não pode ser negativo' 
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Utilitário para extrair apenas o primeiro erro de cada campo
 */
export function getFirstErrorPerField(errors: ValidationError[]): Record<string, string> {
  const errorMap: Record<string, string> = {};
  
  errors.forEach(error => {
    if (!errorMap[error.field]) {
      errorMap[error.field] = error.message;
    }
  });

  return errorMap;
}

/**
 * Utilitário para verificar se um campo específico tem erro
 */
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some(error => error.field === fieldName);
}

/**
 * Utilitário para obter mensagem de erro de um campo específico
 */
export function getFieldError(errors: ValidationError[], fieldName: string): string | null {
  const error = errors.find(error => error.field === fieldName);
  return error ? error.message : null;
}

/**
 * Valida se um valor está presente (não é null, undefined ou string vazia)
 */
export function isPresent(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return true;
}

/**
 * Valida se um array tem pelo menos um elemento
 */
export function hasMinItems(array: any[], minItems: number = 1): boolean {
  return Array.isArray(array) && array.length >= minItems;
}

/**
 * Valida se um número está dentro de um intervalo
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Valida se um valor está na lista de valores permitidos
 */
export function isInList(value: any, allowedValues: any[]): boolean {
  return allowedValues.includes(value);
}