"use client";

import { useMemo, useState } from "react";

import {
  ContentNavigation,
  type CollectionTreeNode,
} from "@/components/ui/content-navigation";
import { type AppMenuItem } from "@/lib/auth/role-gating";

const GROUP_LABELS: Record<AppMenuItem["group"], string> = {
  qc: "Quality Control",
  dashboard: "Dashboards",
  admin: "Administration",
};

const GROUP_ORDER: AppMenuItem["group"][] = ["qc", "dashboard", "admin"];

function toNavigationTree(menuItems: AppMenuItem[]): CollectionTreeNode[] {
  return GROUP_ORDER.reduce<CollectionTreeNode[]>((nodes, group) => {
    const children = menuItems.filter((item) => item.group === group);
    if (children.length === 0) return nodes;

    nodes.push({
      collection: group,
      name: GROUP_LABELS[group],
      icon: group === "admin" ? "database" : "folder",
      meta: {
        collection: group,
        icon: group === "admin" ? "database" : "folder",
        collapse: "open",
      },
      schema: null,
      children: children.map((item) => ({
        collection: item.href,
        name: item.label,
        icon: "table",
        meta: {
          collection: item.href,
          icon: "table",
        },
        schema: {
          name: item.href,
        },
        children: [],
      })),
    });

    return nodes;
  }, []);
}

export function AppRoleNavigation({
  menuItems,
  currentHref,
  loading,
  isAdmin,
  onNavigate,
}: {
  menuItems: AppMenuItem[];
  currentHref?: string;
  loading?: boolean;
  isAdmin?: boolean;
  onNavigate: (href: string) => void;
}) {
  const [activeGroups, setActiveGroups] = useState<string[]>(GROUP_ORDER);
  const navigationTree = useMemo(() => toNavigationTree(menuItems), [menuItems]);

  const toggleGroup = (group: string) => {
    setActiveGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group]
    );
  };

  return (
    <ContentNavigation
      rootCollections={navigationTree}
      activeGroups={activeGroups}
      onToggleGroup={toggleGroup}
      currentCollection={currentHref}
      onNavigate={onNavigate}
      loading={loading}
      dense
      isAdmin={isAdmin}
    />
  );
}
