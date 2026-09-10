import api from './api';

export const statsService = {
  async getAdminStats() {
    const response = await api.get('/stats/admin');
    return response.data;
  },

  async getStudentStats() {
    const response = await api.get('/stats/student');
    return response.data;
  },
};
