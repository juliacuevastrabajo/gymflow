import type { AuthLoginResponse } from "./gymflowService";

type SessionListener = (session: AuthLoginResponse) => void | Promise<void>;
type SessionExpiredListener = () => void;

let pendingSession: AuthLoginResponse | null = null;
const listeners = new Set<SessionListener>();
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function publishAuthenticatedSession(session: AuthLoginResponse) {
  pendingSession = session;
  listeners.forEach((listener) => {
    void listener(session);
  });
  if (listeners.size > 0) {
    pendingSession = null;
  }
}

export function subscribeAuthenticatedSession(listener: SessionListener) {
  listeners.add(listener);
  if (pendingSession) {
    const session = pendingSession;
    pendingSession = null;
    void listener(session);
  }

  return () => {
    listeners.delete(listener);
  };
}

export function publishSessionExpired() {
  sessionExpiredListeners.forEach((listener) => listener());
}

export function subscribeSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}
