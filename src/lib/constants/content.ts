/**
 * Constantes de Conteúdo - DataLife EPI
 *
 * Centraliza todos os textos e constantes da aplicação para garantir consistência.
 * Facilita internacionalização futura e mudanças globais de copy.
 */

// Estados de Loading
export const LOADING_TEXTS = {
  default: "Carregando...",
  processing: "Processando...",
  saving: "Salvando...",
  deleting: "Excluindo...",
  creating: "Criando...",
  updating: "Atualizando...",
  searching: "Buscando...",
  loading: "Carregando...",
  signing: "Assinando...",
  uploading: "Enviando...",
  downloading: "Baixando...",
} as const;

// Mensagens de Erro
export const ERROR_MESSAGES = {
  defaultError: "Ocorreu um erro. Tente novamente.",
  networkError: "Erro de conexão. Verifique sua internet.",
  validationError: "Dados inválidos. Verifique os campos.",
  unauthorized: "Acesso negado. Faça login novamente.",
  notFound: "Item não encontrado.",
  serverError: "Erro interno do servidor. Tente novamente mais tarde.",
  timeout: "Operação expirou. Tente novamente.",
} as const;

// Mensagens de Sucesso
export const SUCCESS_MESSAGES = {
  saved: "Dados salvos com sucesso!",
  created: "Item criado com sucesso!",
  updated: "Item atualizado com sucesso!",
  deleted: "Item excluído com sucesso!",
  copied: "Copiado para a área de transferência!",
  sent: "Enviado com sucesso!",
  signed: "Assinatura realizada com sucesso!",
} as const;

// Labels de Formulários
export const FORM_LABELS = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  document: "Documento",
  cpf: "CPF",
  cnpj: "CNPJ",
  address: "Endereço",
  city: "Cidade",
  state: "Estado",
  zipCode: "CEP",
  description: "Descrição",
  observations: "Observações",
  date: "Data",
  startDate: "Data de Início",
  endDate: "Data de Fim",
  status: "Status",
  category: "Categoria",
  type: "Tipo",
  quantity: "Quantidade",
  price: "Preço",
  total: "Total",
} as const;

// Textos de Botões
export const BUTTON_TEXTS = {
  save: "Salvar",
  cancel: "Cancelar",
  confirm: "Confirmar",
  delete: "Excluir",
  edit: "Editar",
  add: "Adicionar",
  create: "Criar",
  update: "Atualizar",
  search: "Buscar",
  filter: "Filtrar",
  clear: "Limpar",
  reset: "Resetar",
  back: "Voltar",
  next: "Próximo",
  previous: "Anterior",
  close: "Fechar",
  open: "Abrir",
  view: "Visualizar",
  download: "Baixar",
  upload: "Enviar",
  copy: "Copiar",
  share: "Compartilhar",
  print: "Imprimir",
  export: "Exportar",
  import: "Importar",
} as const;

// Mensagens de Confirmação
export const CONFIRMATION_MESSAGES = {
  delete: "Tem certeza que deseja excluir este item?",
  deleteMultiple: "Tem certeza que deseja excluir os itens selecionados?",
  unsavedChanges: "Você tem alterações não salvas. Deseja continuar?",
  cancel: "Tem certeza que deseja cancelar esta operação?",
  reset: "Tem certeza que deseja resetar os dados?",
  clear: "Tem certeza que deseja limpar todos os campos?",
} as const;

// Status de EPIs
export const EPI_STATUS = {
  active: "Ativo",
  expired: "Vencido",
  suspended: "Suspenso",
  archived: "Arquivado",
  pending: "Pendente",
  delivered: "Entregue",
  returned: "Devolvido",
} as const;

// Status de Colaboradores
export const EMPLOYEE_STATUS = {
  active: "Ativo",
  away: "Afastado",
  dismissed: "Desligado",
  vacation: "Férias",
  training: "Treinamento",
} as const;

// Status de Estoque
export const STOCK_STATUS = {
  available: "Disponível",
  lowStock: "Estoque Baixo",
  expired: "Vencido",
  outOfStock: "Esgotado",
  reserved: "Reservado",
} as const;

// Textos de Navegação
export const NAVIGATION = {
  dashboard: "Dashboard",
  catalog: "Catálogo",
  stock: "Estoque",
  records: "Fichas",
  movements: "Movimentações",
  audit: "Auditoria",
  reports: "Relatórios",
  settings: "Configurações",
  profile: "Perfil",
  logout: "Sair",
} as const;

// Configurações de Tempo
export const TIMINGS = {
  debounceDefault: 300, // ms
  debounceSearch: 500, // ms
  toastDuration: 5000, // ms
  tooltipDelay: 500, // ms
  animationDuration: 200, // ms
} as const;

// Validações
export const VALIDATION = {
  required: "Este campo é obrigatório",
  invalidEmail: "E-mail inválido",
  invalidCPF: "CPF inválido",
  invalidCNPJ: "CNPJ inválido",
  invalidPhone: "Telefone inválido",
  minLength: (min: number) => `Mínimo de ${min} caracteres`,
  maxLength: (max: number) => `Máximo de ${max} caracteres`,
  mustMatch: "Os campos devem ser iguais",
} as const;

// Placeholders
export const PLACEHOLDERS = {
  search: "Digite para buscar...",
  searchEmployees: "Buscar colaboradores...",
  searchEPIs: "Buscar EPIs...",
  searchCompanies: "Buscar empresas...",
  selectOption: "Selecione uma opção...",
  enterText: "Digite aqui...",
  selectDate: "Selecione uma data...",
  noData: "Nenhum dado encontrado",
  loading: "Carregando dados...",
} as const;

// Tipos TypeScript para type safety
export type LoadingText = keyof typeof LOADING_TEXTS;
export type ErrorMessage = keyof typeof ERROR_MESSAGES;
export type SuccessMessage = keyof typeof SUCCESS_MESSAGES;
export type ButtonText = keyof typeof BUTTON_TEXTS;
export type FormLabel = keyof typeof FORM_LABELS;
export type ValidationMessage = keyof typeof VALIDATION;
