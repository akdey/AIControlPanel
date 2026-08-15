import { apiClient } from '../apiClient';
import projectsData from '../../data/projectsData.json';

export interface CreateProjectPayload {
  name: string;
  description: string;
  environment: string;
}

export interface CreateAgentPayload {
  projectId: string;
  name: string;
  model: string;
}

export const projectsApi = {
  /**
   * Fetch all projects and attached agents.
   */
  getProjects: async () => {
    try {
      // Return mocked JSON data inside try block
      return projectsData;

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.get('/projects');
       * return response.data;
       */
    } catch (error) {
      console.error('[ProjectsAPI] Failed to fetch projects:', error);
      throw error;
    }
  },

  /**
   * Create new project workspace.
   */
  createProject: async (payload: CreateProjectPayload) => {
    try {
      // Return mocked payload execution inside try block
      return {
        id: `proj_${Date.now().toString().slice(-4)}`,
        ...payload,
        status: 'pre-published',
        agents: [],
      };

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.post('/projects', payload);
       * return response.data;
       */
    } catch (error) {
      console.error('[ProjectsAPI] Failed to create project:', error);
      throw error;
    }
  },

  /**
   * Create new agent inside project workspace.
   */
  createAgent: async (payload: CreateAgentPayload) => {
    try {
      // Return mocked payload execution inside try block
      return {
        id: `agt_${Date.now().toString().slice(-4)}`,
        name: payload.name,
        model: payload.model,
        status: 'draft',
        hasPipeline: false,
      };

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.post(`/projects/${payload.projectId}/agents`, payload);
       * return response.data;
       */
    } catch (error) {
      console.error('[ProjectsAPI] Failed to create agent:', error);
      throw error;
    }
  },

  /**
   * Save agent DAG pipeline topology.
   */
  saveAgentPipeline: async (agentId: string, pipelineNodes: unknown[], pipelineEdges: unknown[]) => {
    try {
      // Return mocked save confirmation inside try block
      return { success: true, agentId, updatedNodes: pipelineNodes.length };

      /*
       * Production Backend Call (uncomment when connecting to backend server):
       * const response = await apiClient.put(`/agents/${agentId}/pipeline`, {
       *   nodes: pipelineNodes,
       *   edges: pipelineEdges,
       * });
       * return response.data;
       */
    } catch (error) {
      console.error('[ProjectsAPI] Failed to save agent pipeline DAG:', error);
      throw error;
    }
  },
};
