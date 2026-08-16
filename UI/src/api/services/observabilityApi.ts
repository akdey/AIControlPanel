import { apiClient } from '../apiClient';
import sessionsData from '../../data/sessions.json';
import tracesData from '../../data/traces.json';

export const observabilityApi = {
  /**
   * Fetch observability sessions.
   */
  getSessions: async () => {
    try {
      const response = await apiClient.get('/observability/sessions');
      return response.data;
    } catch (error) {
      console.warn('[ObservabilityAPI] Backend sessions call failed. Falling back to local mock data:', error);
      return sessionsData;
    }
  },

  /**
   * Fetch observability traces using Adaptive Layer.
   */
  getTraces: async (projectId?: string, agentId?: string) => {
    try {
      const response = await apiClient.get('/observability/traces', {
        params: { projectId, agentId },
      });
      return response.data;
    } catch (error) {
      console.warn('[ObservabilityAPI] Backend traces call failed. Falling back to local mock data:', error);
      return tracesData;
    }
  },
};
