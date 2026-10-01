export interface NodeData {
  acct_id: number;
  acct_no: string;
  bank: string;
  ifsc: string;
  layer: string;
  hop: number;
  taint_in_paise: number;
  taint_out_paise: number;
  held_paise: number;
  first_seen_epoch: number;
}

export interface EdgeData {
  txn_id: string;
  src_id: number;
  dst_id: number;
  src_acct: string;
  dst_acct: string;
  amount_paise: number;
  taint_paise: number;
  ts_epoch: number;
  hop: number;
  narration: string;
  payment_mode: string;
  ip_foreign: boolean;
  device_headless: boolean;
}

export interface FreezeRecommendation {
  acct_no: string;
  bank: string;
  ifsc: string;
  layer: string;
  hop: number;
  held_paise: number;
  held_inr: number;
  coverage_pct: number;
}

export interface TraceResponse {
  trace_id: string;
  victim_account: string;
  initial_loss_paise: number;
  initial_loss_inr: number;
  total_held_paise: number;
  total_held_inr: number;
  total_cashed_out_paise: number;
  total_cashed_out_inr: number;
  recovery_potential_pct: number;
  timing_ms: number;
  num_nodes: number;
  num_edges: number;
  nodes: NodeData[];
  edges: EdgeData[];
  freeze_recommendations: FreezeRecommendation[];
}

export interface SystemStats {
  process_ram_mb: number;
  peak_process_ram_mb: number;
  total_system_ram_gb: number;
  available_system_ram_gb: number;
  system_ram_percent: number;
  cpu_percent: number;
  cpu_count: number;
}

export interface OverviewData {
  total_transactions: number;
  total_accounts: number;
  tier_distribution: Record<string, number>;
  role_distribution: Record<string, number>;
  top_mules: any[];
  sample_victims: string[];
  models_status?: Record<string, any>;
  telemetry: SystemStats;
}
