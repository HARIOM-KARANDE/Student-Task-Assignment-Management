import api from './api';

export const classService = {
  async getAll(params = {}) {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/classes', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  async generateCode() {
    const response = await api.post('/classes/generate-code');
    return response.data;
  },

  async joinClass(code) {
    const response = await api.post('/classes/join', { code });
    return response.data;
  },

  async getStudents(classId) {
    const response = await api.get(`/classes/${classId}/students`);
    return response.data;
  },

  async addStudent(classId, studentId) {
    const response = await api.post(`/classes/${classId}/students/${studentId}`);
    return response.data;
  },

  async removeStudent(classId, studentId) {
    const response = await api.delete(`/classes/${classId}/students/${studentId}`);
    return response.data;
  },

  async leaveClass(classId) {
    const response = await api.post(`/classes/${classId}/leave`);
    return response.data;
  },
};
