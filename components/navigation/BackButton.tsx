"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

interface BackButtonProps {
  /**
   * Explicit destination. Use on child/detail pages so "back" always lands on
   * the parent list (e.g. a lot detail → /qc/lots). When omitted, the button
   * falls back to browser history (`router.back()`), which suits top-level
   * pages reached from the nav.
   */
  href?: string;
  label?: string;
}

/**
 * Consistent back affordance shared across every authenticated page. It is a
 * Client Component, so it can be dropped into Server Component pages as an
 * element (never as a `component={...}` prop, which would 500 the route).
 */
export function BackButton({ href, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  const common = {
    color: "gray" as const,
    leftSection: <IconArrowLeft size={16} />,
    size: "sm" as const,
    style: { width: "fit-content" },
    variant: "subtle" as const
  };

  if (href) {
    return (
      <Button component={Link} href={href} {...common}>
        {label}
      </Button>
    );
  }

  return (
    <Button onClick={() => router.back()} {...common}>
      {label}
    </Button>
  );
}
