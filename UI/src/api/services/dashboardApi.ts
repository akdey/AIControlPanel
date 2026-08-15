import { apiClient } from '../apiClient';
import dashboardData from '../../data/dashboardData.json';
import customDashboardsData from '../../data/customDashboardsData.json';
import type { CustomDashboardItem } from '../../types/customDashboard';

export const dashboardApi = {
  /**
   * Fetch default operations dashboard metrics.
   */
  getDashboardMetrics: async () => {
    try {
      // Return mocked JSON data inside try block
      return dashboardData;

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.get('/dashboards/default');
       * return response.data;
       */
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch default dashboard metrics:', error);
      throw error;
    }
  },

  /**
   * Fetch custom dashboards.
   */
  getCustomDashboards: async (): Promise<CustomDashboardItem[]> => {
    try {
      // Return mocked JSON data inside try block
      return customDashboardsData as CustomDashboardItem[];

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.get('/dashboards/custom');
       * return response.data;
       */
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch custom dashboards:', error);
      throw error;
    }
  },

  /**
   * Create or update custom dashboard.
   */
  saveCustomDashboard: async (dashboard: Partial<CustomDashboardItem>) => {
    try {
      // Mocked save execution inside try block
      return { success: true, id: dashboard.id || `dash_${Date.now()}` };

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.post('/dashboards/custom', dashboard);
       * return response.data;
       */
    } catch (error) {
      console.error('[DashboardAPI] Failed to save custom dashboard:', error);
      throw error;
    }
  },
};
