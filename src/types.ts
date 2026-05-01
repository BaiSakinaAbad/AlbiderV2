export type UserRole = 'admin' | 'teacher' | 'guard' | 'parent';

export type StudentStatus = 'absent' | 'present' | 'dismissed';

export type RelationshipType = 'Case 1' | 'Case 2' | 'Case 3';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  grade_level?: string;
  created_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  grade_level: string;
  section: string;
  status: StudentStatus;
  holding_area: string;
  qr_id: string;
}

export interface Fetcher {
  id: string;
  student_id: string;
  name: string;
  relationship: string;
  relationship_type: RelationshipType;
  phone_number: string;
  photo_url?: string;
  is_active: boolean;
  expiration_date?: string;
}

export interface DismissalLog {
  id: string;
  student_id: string;
  fetcher_id: string;
  scanned_at: string;
  released_at?: string;
  guard_id: string;
  teacher_id?: string;
  status: 'waiting_at_gate' | 'dismissed';
}

export interface GradeSettings {
  grade: string;
  dismissal_time: string; // ISO time or just HH:mm
  grace_period_mins: number;
}
