import api from './api';

export const studentService = {
  async getAll(params = {}) {
    const response = await api.get('/students', { params });
    return response.data;
  },

  async getDetail(id) {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  async toggleStatus(id) {
    const response = await api.patch(`/students/${id}/status`);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
