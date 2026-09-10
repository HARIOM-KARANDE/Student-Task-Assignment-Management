import api from './api';

export const assignmentService = {
  async getAll(params = {}) {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  async uploadQuestionPdf(assignmentId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/assignments/${assignmentId}/upload-question`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
