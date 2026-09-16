import { useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  openIssuesCount: number;
}

export interface GithubSyncStatus {
  id: string;
  projectId: string;
  workspaceId?: string;
  githubRepoOwner: string;
  githubRepoName: string;
  githubRepoId?: string;
  syncEnabled: boolean;
  syncInterval: number;
  syncDirection: string;
  lastSyncAt: string | null;
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null;
  lastSyncError: string | null;
  issuesImported: number;
  statusMappings: Record<string, string> | null;
  hasToken: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectGithubPayload {
  projectId: string;
  workspaceId?: string;
  repoOwner: string;
  repoName: string;
  repoId?: string;
  token: string;
  syncInterval?: number;
  syncDirection?: string;
  statusMappings?: Record<string, string>;
}

export interface UpdateGithubSyncPayload {
  syncEnabled?: boolean;
  syncInterval?: number;
  syncDirection?: string;
  statusMappings?: Record<string, string>;
}

export function useGithubSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  /** Validate token and list accessible repositories */
  const validateAndListRepos = useCallback(
    async (token: string): Promise<GithubRepo[]> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post('/github-sync/validate/repos', { token });
        return res.data;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to validate GitHub token';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** Connect a project to a GitHub repository */
  const connect = useCallback(async (payload: ConnectGithubPayload): Promise<GithubSyncStatus> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/github-sync/connect', payload);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect GitHub repository';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Get sync status for a project */
  const getStatus = useCallback(async (projectId: string): Promise<GithubSyncStatus | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/github-sync/${projectId}`);
      return res.data;
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        return null;
      }
      const msg = err?.response?.data?.message || err?.message || 'Failed to get sync status';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Update sync settings */
  const updateSync = useCallback(
    async (projectId: string, payload: UpdateGithubSyncPayload): Promise<GithubSyncStatus> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.put(`/github-sync/${projectId}`, payload);
        return res.data;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to update GitHub sync settings';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** Trigger manual sync */
  const syncNow = useCallback(async (projectId: string): Promise<GithubSyncStatus> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/github-sync/${projectId}/sync`);
      return res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to sync GitHub issues';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Disconnect GitHub sync */
  const disconnect = useCallback(async (projectId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/github-sync/${projectId}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to disconnect GitHub sync';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      loading,
      error,
      clearError,
      validateAndListRepos,
      connect,
      getStatus,
      updateSync,
      syncNow,
      disconnect,
    }),
    [loading, error, validateAndListRepos, connect, getStatus, updateSync, syncNow, disconnect],
  );
}
