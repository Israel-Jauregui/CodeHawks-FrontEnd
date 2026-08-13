import {
  InteractionRequiredAuthError,
  InteractionStatus,
  type AccountInfo,
} from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAuthConfigurationError } from '../config/environment';
import {
  apiRequest,
  apiRequestPage,
  configureAccessTokenProvider,
} from '../services/apiClient';
import {
  uploadWithPresignedPost,
  type PresignedImageUpload,
} from '../services/mediaUpload';
import type {
  MemberProfile,
  MemberProfilePatch,
  Notification,
} from '../types/clubData';
import { acquireApiToken, loginRequest } from './msalConfig';

interface AuthContextValue {
  isAvailable: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MemberProfile | null;
  error: string | null;
  notifications: Notification[];
  unreadCount: number;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: MemberProfilePatch) => Promise<MemberProfile>;
  uploadAvatar: (file: File) => Promise<MemberProfile>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string, read: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function EntraAuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getAccount = useCallback((): AccountInfo | null => {
    return instance.getActiveAccount() ?? accounts[0] ?? null;
  }, [accounts, instance]);

  const getAccessTokenForAccount = useCallback(async (account: AccountInfo): Promise<string> => {
    try {
      return (await acquireApiToken(instance, account)).accessToken;
    } catch (unknownError) {
      if (!(unknownError instanceof InteractionRequiredAuthError)) throw unknownError;
      return (await instance.acquireTokenPopup({ ...loginRequest, account })).accessToken;
    }
  }, [instance]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    const account = getAccount();
    if (!account) throw new Error('Sign in with your UNG Microsoft account to continue.');
    return getAccessTokenForAccount(account);
  }, [getAccessTokenForAccount, getAccount]);

  const loadProfileForAccount = useCallback(async (account: AccountInfo) => {
    const accessToken = await getAccessTokenForAccount(account);
    const profile = await apiRequest<MemberProfile>('/v1/me', {
      auth: true,
      accessToken,
    });
    setUser(profile);
    setError(null);
    return profile;
  }, [getAccessTokenForAccount]);

  const refreshProfile = useCallback(async () => {
    const account = getAccount();
    if (!account) {
      setUser(null);
      return;
    }
    await loadProfileForAccount(account);
  }, [getAccount, loadProfileForAccount]);

  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await instance.loginPopup(loginRequest);
      if (!result.account) throw new Error('Microsoft sign-in did not return an account.');
      instance.setActiveAccount(result.account);
      await loadProfileForAccount(result.account);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Microsoft sign-in failed.';
      setError(message);
      throw unknownError;
    } finally {
      setIsLoading(false);
    }
  }, [instance, loadProfileForAccount]);

  const logout = useCallback(async () => {
    const account = getAccount();
    setUser(null);
    setNotifications([]);
    setError(null);
    await instance.logoutPopup({
      ...(account ? { account } : {}),
      mainWindowRedirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    });
  }, [getAccount, instance]);

  const updateProfile = useCallback(async (patch: MemberProfilePatch) => {
    const profile = await apiRequest<MemberProfile>('/v1/me', {
      method: 'PATCH',
      auth: true,
      body: patch,
    });
    setUser(profile);
    return profile;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const upload = await apiRequest<PresignedImageUpload>('/v1/me/avatar-upload', {
      method: 'POST',
      auth: true,
      body: { contentType: file.type, fileSize: file.size },
    });
    await uploadWithPresignedPost(upload, file);
    return updateProfile({ avatarUrl: upload.publicUrl });
  }, [updateProfile]);

  const refreshNotifications = useCallback(async () => {
    if (!getAccount() || !user) {
      setNotifications([]);
      return;
    }
    const page = await apiRequestPage<Notification>('/v1/me/notifications?read=false&limit=100', {
      auth: true,
    });
    setNotifications(page.data);
  }, [getAccount, user]);

  const markNotificationRead = useCallback(async (notificationId: string, read: boolean) => {
    const updated = await apiRequest<Notification>(
      `/v1/me/notifications/${encodeURIComponent(notificationId)}`,
      { method: 'PATCH', auth: true, body: { read } },
    );
    setNotifications((current) => read
      ? current.filter((notification) => notification.id !== notificationId)
      : [updated, ...current.filter((notification) => notification.id !== notificationId)]);
  }, []);

  useEffect(() => {
    configureAccessTokenProvider(getAccessToken);
    return () => configureAccessTokenProvider(null);
  }, [getAccessToken]);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    const account = getAccount();
    if (!account) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    void loadProfileForAccount(account)
      .catch((unknownError: unknown) => {
        if (!isCurrent) return;
        setUser(null);
        setError(unknownError instanceof Error ? unknownError.message : 'Unable to load your profile.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [getAccount, inProgress, loadProfileForAccount]);

  useEffect(() => {
    if (!user) return undefined;

    const refresh = () => void refreshNotifications().catch(() => undefined);
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('club-membership-changed', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('club-membership-changed', refresh);
    };
  }, [refreshNotifications, user]);

  const value = useMemo<AuthContextValue>(() => ({
    isAvailable: true,
    isAuthenticated: Boolean(user),
    isLoading,
    user,
    error,
    notifications,
    unreadCount: notifications.length,
    login,
    logout,
    getAccessToken,
    refreshProfile,
    updateProfile,
    uploadAvatar,
    refreshNotifications,
    markNotificationRead,
  }), [
    error,
    getAccessToken,
    isLoading,
    login,
    logout,
    markNotificationRead,
    notifications,
    refreshNotifications,
    refreshProfile,
    updateProfile,
    uploadAvatar,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function UnavailableAuthProvider({ children }: { children: ReactNode }) {
  const configurationError = getAuthConfigurationError()
    ?? 'Microsoft sign-in is unavailable while using local club data.';

  const value = useMemo<AuthContextValue>(() => ({
    isAvailable: false,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: configurationError,
    notifications: [],
    unreadCount: 0,
    login: async () => { throw new Error(configurationError); },
    logout: async () => undefined,
    getAccessToken: async () => { throw new Error(configurationError); },
    refreshProfile: async () => undefined,
    updateProfile: async () => { throw new Error(configurationError); },
    uploadAvatar: async () => { throw new Error(configurationError); },
    refreshNotifications: async () => undefined,
    markNotificationRead: async () => undefined,
  }), [configurationError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an auth provider.');
  return value;
}
