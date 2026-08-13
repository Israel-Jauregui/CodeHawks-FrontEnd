import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { apiRequestPage } from '../../../services/apiClient';
import type { Notification, ResourceType } from '../../../types/clubData';
import './NotificationsModule.css';

interface NotificationsModuleProps {
  onOpenResource: (resourceType: ResourceType, resourceId: string) => void;
}

async function loadAllNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  let cursor: string | undefined;
  do {
    const page = await apiRequestPage<Notification>(
      `/v1/me/notifications?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      { auth: true },
    );
    notifications.push(...page.data);
    cursor = page.meta.nextCursor ?? undefined;
  } while (cursor);
  return notifications;
}

export default function NotificationsModule({ onOpenResource }: NotificationsModuleProps) {
  const { user, markNotificationRead, refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      setNotifications(await loadAllNotifications());
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  if (!user) return <section className="notifications-module"><fieldset><legend>Sign In Required</legend><p>Sign in to view your CodeHawks notifications.</p></fieldset></section>;

  const openNotification = async (notification: Notification) => {
    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id, true);
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
        await refreshNotifications();
      } catch (unknownError) {
        setError(unknownError instanceof Error ? unknownError.message : 'Unable to mark the notification read.');
        return;
      }
    }
    onOpenResource(notification.resourceType, notification.resourceId);
  };

  return (
    <section className="notifications-module">
      <div className="notifications-module__heading">
        <div><h2>Notification Inbox</h2><p>Project and team membership updates.</p></div>
        <button type="button" onClick={() => void reload()} disabled={isLoading}>Refresh</button>
      </div>
      {error && <fieldset className="notifications-module__error"><legend>Error</legend><p>{error}</p></fieldset>}
      {isLoading && <fieldset><legend>Receiving Mail</legend><p>Checking your inbox...</p></fieldset>}
      {!isLoading && notifications.length === 0 && <fieldset><legend>Inbox</legend><p>Your inbox is empty.</p></fieldset>}
      {!isLoading && notifications.length > 0 && (
        <div className="notifications-module__list">
          {notifications.map((notification) => (
            <button key={notification.id} type="button" className={`notifications-module__item${notification.readAt ? ' is-read' : ''}`} onClick={() => void openNotification(notification)}>
              <span className="notifications-module__icon" aria-hidden="true">{notification.readAt ? '✉' : '✉'}</span>
              <span><strong>{notification.title}</strong><span>{notification.message}</span><small>{new Date(notification.createdAt).toLocaleString()}</small></span>
              <span className="notifications-module__resource">{notification.resourceType}: {notification.resourceName}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
