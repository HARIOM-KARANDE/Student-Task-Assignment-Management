import api from './api';

export const subjectService = {
  async getAll(search = '') {
    const params = search ? { search } : {};
    const response = await api.get('/subjects', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/subjects', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },
};
