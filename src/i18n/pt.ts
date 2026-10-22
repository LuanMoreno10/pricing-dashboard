import type { MessageKey } from './en';

// Portuguese (Portugal) starter file. Missing keys fall back to English.
// To ship Portuguese: translate the remaining keys, then set `available: true` in ./index.ts.
export const pt: Partial<Record<MessageKey, string>> = {
  'app.name': 'Tabela de Preços',
  'app.tagline': 'Gabinete de preços freelance',
  'nav.overview': 'Visão geral',
  'nav.services': 'Serviços',
  'nav.maintenance': 'Manutenção e tarifas',
  'nav.quote': 'Criar orçamento',
  'nav.categories': 'Categorias',
  'nav.settings': 'Definições e dados',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.duplicate': 'Duplicar',
  'common.archive': 'Arquivar',
};
