import { supabase } from '@/lib/supabase';
import type { CallLog } from '@/types/voice';

const CALL_LOG_COLUMNS =
  'id, direction, inbox_id, thread_id, customer_e164, agent_user_id, status, started_at, ended_at, duration_seconds';

type CallLogRow = Omit<CallLog, 'inbox_display_name' | 'agent_display_name'> & {
  inboxes?: { display_name: string | null } | { display_name: string | null }[] | null;
};

async function fetchAgentNames(userIds: string[]): Promise<Record<string, string | null>> {
  if (userIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', userIds);

  if (error) {
    throw error;
  }

  const map: Record<string, string | null> = {};
  for (const row of data ?? []) {
    map[row.id as string] = (row.display_name as string | null) ?? null;
  }

  return map;
}

function mapCallLogRow(row: CallLogRow, agentNames: Record<string, string | null>): CallLog {
  return {
    id: row.id,
    direction: row.direction,
    inbox_id: row.inbox_id,
    thread_id: row.thread_id,
    customer_e164: row.customer_e164,
    agent_user_id: row.agent_user_id,
    status: row.status,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_seconds: row.duration_seconds,
    inbox_display_name: Array.isArray(row.inboxes)
      ? (row.inboxes[0]?.display_name ?? null)
      : (row.inboxes?.display_name ?? null),
    agent_display_name: row.agent_user_id ? (agentNames[row.agent_user_id] ?? null) : null,
  };
}

export async function fetchCallLogs(limit = 200): Promise<CallLog[]> {
  const { data, error } = await supabase
    .from('call_logs')
    .select(`${CALL_LOG_COLUMNS}, inboxes(display_name)`)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as CallLogRow[];
  const agentIds = [...new Set(rows.map((row) => row.agent_user_id).filter(Boolean))] as string[];
  const agentNames = await fetchAgentNames(agentIds);

  return rows.map((row) => mapCallLogRow(row, agentNames));
}
