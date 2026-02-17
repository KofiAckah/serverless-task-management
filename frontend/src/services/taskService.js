import apiClient from './api';

export const taskService = {
  // Get all tasks (admin sees all, member sees assigned)
  getTasks: async () => {
    try {
      const response = await apiClient.get('/tasks');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Create a new task (admin only)
  createTask: async (taskData) => {
    try {
      const response = await apiClient.post('/tasks', taskData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || error.message 
      };
    }
  },

  // Update task
  updateTask: async (taskId, updates) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Assign task to user (admin only)
  assignTask: async (taskId, assigneeId) => {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/assign`, { assigneeId });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Close task
  closeTask: async (taskId) => {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/close`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Get assigned tasks (member)
  getAssignedTasks: async () => {
    try {
      const response = await apiClient.get('/tasks/assigned');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  }
};
