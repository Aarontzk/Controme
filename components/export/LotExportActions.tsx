"use client";

import { Button, Group } from "@mantine/core";

import { buildLotCsv } from "@/lib/export/csv";
import { getRoleNames, requireRole } from "@/lib/auth/role-gating";
import { useAuth } from "@/lib/buildpad/hooks";

export function LotExportActions({ lotId }: { lotId: string }) {
  const auth = useAuth();
  const roles = getRoleNames(auth.user);
  const canExport = requireRole(roles, ["admin", "manager"]);

  if (!canExport) return null;

  const exportCsv = async () => {
    const response = await fetch(`/api/items/qc_lots/${lotId}`, {
      credentials: "include",
    });
    if (!response.ok) return;
    const json = (await response.json()) as { data?: Record<string, unknown> };
    const row = json.data ?? {};
    const csv = buildLotCsv({
      id: String(row.id ?? lotId),
      lot_code: String(row.lot_code ?? ""),
      qc_stage: String(row.qc_stage ?? ""),
      checked_at: String(row.checked_at ?? ""),
      status: String(row.status ?? ""),
      warning_flag: Boolean(row.warning_flag),
      l_value: Number(row.l_value ?? 0),
      a_value: Number(row.a_value ?? 0),
      b_value: Number(row.b_value ?? 0),
      delta_e: Number(row.delta_e ?? 0),
      reject_reason: String(row.reject_reason ?? ""),
      operator_id: String(row.operator_id ?? ""),
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qc-lot-${lotId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Group gap="xs">
      <Button variant="light" onClick={exportCsv}>
        Export CSV
      </Button>
      <Button component="a" href={`/api/export/lot/${lotId}`} target="_blank">
        Export PDF
      </Button>
    </Group>
  );
}
