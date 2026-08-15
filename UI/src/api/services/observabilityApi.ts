import { apiClient } from '../apiClient';
import sessionsData from '../../data/sessions.json';
import tracesData from '../../data/traces.json';

export const observabilityApi = {
  /**
   * Fetch observability sessions.
   */
  getSessions: async () => {
    try {
      // Return mocked JSON data
      return sessionsData;

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.get('/observability/sessions');
       * return response.data;
       */
    } catch (error) {
      console.error('[ObservabilityAPI] Failed to fetch sessions:', error);
      throw error;
    }
  },

  /**
   * Fetch observability traces.
   */
  getTraces: async () => {
    try {
      // Return mocked JSON data
      return tracesData;

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.get('/observability/traces');
       * return response.data;
       */
    } catch (error) {
      console.error('[ObservabilityAPI] Failed to fetch traces:', error);
      throw error;
    }
  },
};
