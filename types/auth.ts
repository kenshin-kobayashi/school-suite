export type SchoolMemberRole =
  | "owner"
  | "admin"
  | "staff";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  currentSchoolId: string | null;
  role: SchoolMemberRole | null;
};

export type UserDocument = {
  email: string | null;
  displayName: string | null;
  currentSchoolId: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SchoolMemberDocument = {
  role: SchoolMemberRole;
  status: "active" | "inactive";
  createdAt?: unknown;
  updatedAt?: unknown;
};