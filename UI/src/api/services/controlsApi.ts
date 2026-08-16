import { apiClient } from '../apiClient';
import controlsRegistry from '../../data/controls.json';
import type { ControlDefinition, ControlCategory } from '../../types/controls';

export interface ControlsPaletteResponse {
  version: string;
  categories: ControlCategory[];
  controls: ControlDefinition[];
}

export const controlsApi = {
  /**
   * Fetch control categories, subcategories, and controls palette.
   */
  getPalette: async (): Promise<ControlsPaletteResponse> => {
    try {
      const response = await apiClient.get('/controls/palette');
      return response.data;
    } catch (error) {
      console.warn('[ControlsAPI] Backend palette call failed or offline. Falling back to local registry:', error);
      return controlsRegistry as unknown as ControlsPaletteResponse;
    }
  },

  /**
   * Fetch detailed individual agent control definition by name/id.
   * Calls endpoint GET /api/v1/controls/getagentcontrol/{name}
   */
  getAgentControl: async (name: string): Promise<ControlDefinition> => {
    try {
      const response = await apiClient.get(`/controls/getagentcontrol/${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      console.warn(`[ControlsAPI] Failed to fetch agent control '${name}'. Searching local registry fallback:`, error);
      const local = (controlsRegistry.controls as unknown as ControlDefinition[]).find(
        (c) => c.id === name || c.name === name
      );
      if (local) return local;
      throw error;
    }
  },
};
