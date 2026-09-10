import api from './api';

export const notificationService = {
  async getAll() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  async markRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
