import api from './api';

export const submissionService = {
  async submit(assignmentId, formData) {
    const response = await api.post(`/submissions/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMySubmissions() {
    const response = await api.get('/submissions/my');
    return response.data;
  },

  async getByAssignment(assignmentId) {
    const response = await api.get(`/submissions/assignment/${assignmentId}`);
    return response.data;
  },

  async getAll(params = {}) {
    const response = await api.get('/submissions', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  async grade(id, data) {
    const response = await api.post(`/submissions/${id}/grade`, data);
    return response.data;
  },
};
