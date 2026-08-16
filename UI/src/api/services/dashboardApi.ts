import { apiClient } from '../apiClient';
import dashboardData from '../../data/dashboardData.json';
import customDashboardsData from '../../data/customDashboardsData.json';
import type { CustomDashboardItem } from '../../types/customDashboard';

export const dashboardApi = {
  /**
   * Fetch default operations dashboard / FinOps metrics from backend.
   */
  getDashboardMetrics: async () => {
    try {
      const response = await apiClient.get('/finops/metrics');
      return response.data;
    } catch (error) {
      console.warn('[DashboardAPI] Backend finops call failed. Falling back to local dashboardData mock:', error);
      return dashboardData;
    }
  },

  /**
   * Fetch custom dashboards.
   */
  getCustomDashboards: async (): Promise<CustomDashboardItem[]> => {
    try {
      const response = await apiClient.get('/dashboards/custom');
      return response.data;
    } catch (error) {
      console.warn('[DashboardAPI] Backend custom dashboards call failed. Falling back to local mock data:', error);
      return customDashboardsData as CustomDashboardItem[];
    }
  },

  /**
   * Create or update custom dashboard.
   */
  saveCustomDashboard: async (dashboard: Partial<CustomDashboardItem>) => {
    try {
      const response = await apiClient.post('/dashboards/custom', dashboard);
      return response.data;
    } catch (error) {
      console.warn('[DashboardAPI] Backend save custom dashboard failed. Using local fallback:', error);
      return { success: true, id: dashboard.id || `dash_${Date.now()}` };
    }
  },
};
