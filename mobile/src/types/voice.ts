export type CallDirection = 'inbound' | 'outbound';

export type CallLogStatus =
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'missed'
  | 'failed'
  | 'busy'
  | 'no-answer';

export type CallLog = {
  id: string;
  direction: CallDirection;
  inbox_id: string;
  thread_id: string | null;
  customer_e164: string;
  agent_user_id: string | null;
  status: CallLogStatus | string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  inbox_display_name?: string | null;
  agent_display_name?: string | null;
  contact_display_name?: string | null;
};

export type VoiceConnectParams = {
  To: string;
  inboxId: string;
  threadId?: string;
};

export type VoiceTokenResponse = {
  token: string;
  identity: string;
  expiresIn: number;
};

export type VoiceOutboundResponse = {
  connectParams: VoiceConnectParams;
};

export type VoicePhase =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'connecting'
  | 'in-call'
  | 'error';

export type ActiveCallContext = {
  threadId: string;
  inboxId: string;
  customerE164: string;
  contactLabel: string;
};

export type MissedCountResponse = {
  unseenMissedCount: number;
  latestMissed?: CallLog | null;
};
