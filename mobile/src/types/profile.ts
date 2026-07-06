export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'member';

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  phone_e164: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
  onboarding_submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
};
