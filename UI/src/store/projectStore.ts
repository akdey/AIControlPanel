import { create } from 'zustand';

export interface ProjectSettings {
  id: string;
  name: string;
  environment: 'dev' | 'staging' | 'prod';
  costCenterTag: string;
  gatewayEndpoint: string;
  webhookSecret: string;
  preCallHookUrl: string;
  langfuseHost: string;
  langfusePublicKey: string;
  shadowEvaluationMode: boolean;
  selectedPolicyPack: string;
}

interface ProjectState {
  currentProject: ProjectSettings;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
  regenerateSecrets: () => void;
}

const defaultProject: ProjectSettings = {
  id: 'proj_global_fintech',
  name: 'Global FinTech Ops',
  environment: 'prod',
  costCenterTag: 'CC-9021-FINTECH',
  gatewayEndpoint: 'https://gateway.internal.corp/v1',
  webhookSecret: 'whsec_98a72b14c5e3f19a287b',
  preCallHookUrl: 'https://gateway.internal.corp/v1/pre_call_hook',
  langfuseHost: 'https://cloud.langfuse.com',
  langfusePublicKey: 'pk-lf-91823-prod-82910',
  shadowEvaluationMode: true,
  selectedPolicyPack: 'Strict Financial Compliance',
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: defaultProject,
  updateProjectSettings: (settings) =>
    set({
      currentProject: { ...get().currentProject, ...settings },
    }),
  regenerateSecrets: () => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 18)}`;
    set({
      currentProject: { ...get().currentProject, webhookSecret: newSecret },
    });
  },
}));
