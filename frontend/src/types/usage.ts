// ============================================
// Usage Types
// ============================================

export interface UsageLog {
  trace_id: string;
  session_id: string;
  user_id: string;
  username: string;
  agent_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  duration: number;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  step_count?: number;
  tool_calls?: number;
}

export interface UsageStats {
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cache_creation_tokens: number;
  total_cache_read_tokens: number;
  total_duration: number;
}

export interface UsageLogListResponse {
  items: UsageLog[];
  total: number;
  stats: UsageStats;
}
