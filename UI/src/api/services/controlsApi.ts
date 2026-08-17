import { apiClient } from '../apiClient';
import type { ControlDefinition, ControlCategory } from '../../types/controls';

export interface ControlsPaletteResponse {
  version: string;
  categories: ControlCategory[];
  controls: ControlDefinition[];
}

export const controlsApi = {
  /**
   * Fetch control categories, subcategories, and controls palette from backend database.
   */
  getPalette: async (): Promise<ControlsPaletteResponse> => {
    const response = await apiClient.get('/controls/palette');
    return response.data;
  },

  /**
   * Fetch detailed individual agent control definition by name/id.
   * Calls endpoint GET /api/v1/controls/getagentcontrol/{name}
   */
  getAgentControl: async (name: string): Promise<ControlDefinition> => {
    const response = await apiClient.get(`/controls/getagentcontrol/${encodeURIComponent(name)}`);
    return response.data;
  },
};
