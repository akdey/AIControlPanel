export interface AgentPolicyProfile {
  allowedTools: string[];
  blockedTools: string[];
  tpmLimit: number;
  rpmLimit: number;
  mtlsFingerprint: string;
  delegationTokenValidUntil: string;
}

export interface AgentItem {
  id: string;
  name: string;
  role: string;
  associatedPipeline: string;
  pipelineId: string;
  monthlySpend: number;
  monthlyLimit: number;
  status: 'active' | 'rate_limited' | 'quarantined' | 'idle';
  totalInvocations24h: number;
  blockedIncidents24h: number;
  policyProfile: AgentPolicyProfile;
}
