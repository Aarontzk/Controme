import {
  normalizeRoleName,
  type AppRole,
} from "@/lib/auth/role-gating";
import { RoleNavigationPreview } from "./RoleNavigationPreview";

type RoleNavigationPageProps = {
  searchParams: Promise<{
    role?: string | string[];
  }>;
};

function getRoleParam(role: string | string[] | undefined): AppRole {
  const value = Array.isArray(role) ? role[0] : role;
  return normalizeRoleName(value) ?? "qc_operator";
}

export default async function RoleNavigationPreviewPage({
  searchParams,
}: RoleNavigationPageProps) {
  const params = await searchParams;
  return <RoleNavigationPreview role={getRoleParam(params.role)} />;
}
