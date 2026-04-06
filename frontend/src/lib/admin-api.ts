import api from "@/lib/api";

export const adminApi = {
  getDashboard: async () => {
    const res = await api.get("/admin/dashboard");
    return res.data;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) => {
    const res = await api.get("/admin/users", { params });
    return res.data;
  },

  getUserDetail: async (id: string) => {
    const res = await api.get(`/admin/users/${encodeURIComponent(id)}`);
    return res.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const res = await api.patch(`/admin/users/${encodeURIComponent(id)}/role`, { role });
    return res.data;
  },

  updateUserStatus: async (id: string, status: string) => {
    const res = await api.patch(`/admin/users/${encodeURIComponent(id)}/status`, { status });
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await api.delete(`/admin/users/${encodeURIComponent(id)}`);
    return res.data;
  },

  resetUserPassword: async (id: string) => {
    const res = await api.post(`/admin/users/${encodeURIComponent(id)}/reset-password`);
    return res.data;
  },

  getOrganizations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const res = await api.get("/admin/organizations", { params });
    return res.data;
  },

  getOrganizationDetail: async (id: string) => {
    const res = await api.get(`/admin/organizations/${encodeURIComponent(id)}`);
    return res.data;
  },

  deleteOrganization: async (id: string) => {
    const res = await api.delete(`/admin/organizations/${encodeURIComponent(id)}`);
    return res.data;
  },

  toggleOrganizationArchive: async (id: string) => {
    const res = await api.patch(`/admin/organizations/${encodeURIComponent(id)}/archive`);
    return res.data;
  },

  transferOrganizationOwnership: async (orgId: string, newOwnerId: string) => {
    const res = await api.patch(`/admin/organizations/${encodeURIComponent(orgId)}/transfer-ownership`, { newOwnerId });
    return res.data;
  },

  // System Configuration
  getConfig: async (category?: string) => {
    const res = await api.get("/admin/config", { params: category ? { category } : {} });
    return res.data;
  },

  saveConfig: async (
    settings: Array<{
      key: string;
      value: string;
      description?: string;
      category?: string;
      isEncrypted?: boolean;
    }>
  ) => {
    const res = await api.post("/admin/config", { settings });
    return res.data;
  },

  testSmtp: async () => {
    const res = await api.post("/admin/config/test-smtp");
    return res.data;
  },
};
