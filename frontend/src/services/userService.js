import api from './api';

export const userService = {
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to get users'
      };
    }
  }
};
