export interface Permission {
  id: number;
  name: string;
  subject?: string | null;
  guard_name: string;
}
