import { apiClient } from '../apiClient';

export interface CreateProjectPayload {
  name: string;
  description: string;
  environment: string;
}

export interface CreateAgentPayload {
  projectId: string;
  name: string;
  model: string;
  role?: string;
}

export interface InvokePipelinePayload {
  promptObj?: Record<string, any>;
  prompt?: string;
  tool_manifest?: any[];
  agentId?: string;
}

export const projectsApi = {
  /**
   * Fetch all project workspaces and attached agents from backend database.
   */
  getProjects: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  /**
   * Create new project workspace in backend database.
   */
  createProject: async (payload: CreateProjectPayload) => {
    const response = await apiClient.post('/projects', payload);
    return response.data;
  },

  /**
   * Create new agent inside project workspace in backend database.
   */
  createAgent: async (payload: CreateAgentPayload) => {
    const response = await apiClient.post('/projects/agents', payload);
    return response.data;
  },

  /**
   * Save agent DAG pipeline topology canvas_json in backend database.
   */
  saveAgentPipeline: async (
    agentId: string,
    pipelineNodes: unknown[],
    pipelineEdges: unknown[],
    projectId?: string,
    name?: string
  ) => {
    const response = await apiClient.post('/canvas/save', {
      pipeline_id: agentId,
      project_id: projectId || 'proj_default',
      agent_id: agentId,
      name: name || 'Control Pipeline DAG',
      nodes: pipelineNodes,
      edges: pipelineEdges,
    });
    return response.data;
  },

  /**
   * Get saved canvas_json DAG by pipeline ID from backend database.
   */
  getCanvas: async (pipelineId: string) => {
    const response = await apiClient.get(`/canvas/${pipelineId}`);
    return response.data;
  },

  /**
   * Execute pipeline DAG through Graph Execution Engine endpoint.
   */
  invokePipeline: async (pipelineId: string, payload: InvokePipelinePayload) => {
    const response = await apiClient.post(`/pipeline/invoke/${pipelineId}`, payload);
    return response.data;
  },
};
