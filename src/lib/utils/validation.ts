/**
 * Utilitários de Validação
 * 
 * Funções para validar documentos, emails e outros dados
 */

/**
 * Remove caracteres não numéricos de uma string
 */
function removeNonNumeric(str: string): string {
  return str.replace(/\D/g, '');
}

/**
 * Valida CPF brasileiro
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = removeNonNumeric(cpf);
  
  // Verificar se tem 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Calcular dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  
  return digit1 === parseInt(numbers[9]) && digit2 === parseInt(numbers[10]);
}

/**
 * Valida CNPJ brasileiro
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numbers = removeNonNumeric(cnpj);
  
  // Verificar se tem 14 dígitos
  if (numbers.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Calcular primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  // Calcular segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return digit1 === parseInt(numbers[12]) && digit2 === parseInt(numbers[13]);
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(cnpj: string): string {
  const numbers = removeNonNumeric(cnpj);
  if (numbers.length !== 14) return cnpj;
  
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  const numbers = removeNonNumeric(cpf);
  if (numbers.length !== 11) return cpf;
  
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida email básico
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const numbers = removeNonNumeric(phone);
  // Aceita telefones com 10 ou 11 dígitos (com ou sem 9º dígito)
  return numbers.length === 10 || numbers.length === 11;
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const numbers = removeNonNumeric(phone);
  
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Valida se campo não está vazio
 */
export function isRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * Valida comprimento mínimo
 */
export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Valida comprimento máximo
 */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Validador composto para formulários
 */
export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (!rule.validator(value)) {
      return rule.message;
    }
  }
  return null;
}

/**
 * Regras de validação pré-definidas
 */
export const ValidationRules = {
  required: (message = 'Campo obrigatório'): ValidationRule => ({
    validator: isRequired,
    message,
  }),
  
  validCPF: (message = 'CPF inválido'): ValidationRule => ({
    validator: isValidCPF,
    message,
  }),
  
  validCNPJ: (message = 'CNPJ inválido'): ValidationRule => ({
    validator: isValidCNPJ,
    message,
  }),
  
  validEmail: (message = 'Email inválido'): ValidationRule => ({
    validator: isValidEmail,
    message,
  }),
  
  validPhone: (message = 'Telefone inválido'): ValidationRule => ({
    validator: isValidPhone,
    message,
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value) => minLength(value, min),
    message: message || `Mínimo de ${min} caracteres`,
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value) => maxLength(value, max),
    message: message || `Máximo de ${max} caracteres`,
  }),
};