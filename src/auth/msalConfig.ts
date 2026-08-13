import {
  LogLevel,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import {
  entraApiScope,
  entraSpaClientId,
  entraTenantId,
  isEntraConfigured,
} from '../config/environment';

export const msalConfig: Configuration = {
  auth: {
    clientId: entraSpaClientId,
    authority: `https://login.microsoftonline.com/${entraTenantId}`,
    redirectUri: `${window.location.origin}/redirect.html`,
    postLogoutRedirectUri: `${window.location.origin}/redirect.html`,
  },
  cache: {
    // Keep bearer tokens scoped to the current browser tab instead of
    // persisting them across sessions in localStorage.
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: [entraApiScope],
  prompt: 'select_account' as const,
};

export function createMsalInstance(): PublicClientApplication | null {
  return isEntraConfigured ? new PublicClientApplication(msalConfig) : null;
}

export async function acquireApiToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
): Promise<AuthenticationResult> {
  return instance.acquireTokenSilent({ scopes: [entraApiScope], account });
}
