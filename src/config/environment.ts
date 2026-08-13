import type { DataSource } from '../types/clubData';

const env = import.meta.env;

export const dataSource: DataSource = env.VITE_CLUB_DATA_SOURCE === 'api' ? 'api' : 'local';
export const isApiDataSource = dataSource === 'api';

export const apiBaseUrl = (env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const authProvider = env.VITE_AUTH_PROVIDER ?? 'entra';

export const entraTenantId = env.VITE_ENTRA_TENANT_ID ?? '';
export const entraSpaClientId = env.VITE_ENTRA_SPA_CLIENT_ID ?? '';
export const entraApiScope = env.VITE_ENTRA_API_SCOPE ?? '';

export const isEntraConfigured =
  authProvider === 'entra'
  && Boolean(entraTenantId)
  && Boolean(entraSpaClientId)
  && Boolean(entraApiScope);

export function getAuthConfigurationError(): string | null {
  if (authProvider !== 'entra') {
    return 'This frontend is configured for Microsoft Entra ID only.';
  }

  if (!isEntraConfigured) {
    return 'Microsoft sign-in is not configured. Set the VITE_ENTRA_* environment values.';
  }

  return null;
}
