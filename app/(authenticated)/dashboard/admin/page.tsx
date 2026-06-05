"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconUserPlus } from "@tabler/icons-react";

import { SystemHealthWidget } from "@/components/dashboard/SystemHealthWidget";
import { Input } from "@/components/ui";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import {
  EMPLOYEE_ACCOUNT_ROLES,
  type EmployeeAccountRole,
} from "@/lib/auth/account-roles";

interface AccountValues {
  email: string;
  password: string;
  role: EmployeeAccountRole | "";
}

interface AccountErrors {
  email?: string;
  password?: string;
  role?: string;
}

const initialValues: AccountValues = {
  email: "",
  password: "",
  role: "",
};

function validateAccount(values: AccountValues): AccountErrors {
  return {
    email: !values.email
      ? "Email is required"
      : /^\S+@\S+$/.test(values.email)
        ? undefined
        : "Invalid email",
    password:
      values.password.length >= 8
        ? undefined
        : "Password must be at least 8 characters",
    role: values.role ? undefined : "Role is required",
  };
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<AccountValues>(initialValues);
  const [errors, setErrors] = useState<AccountErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAccount(values);
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password || nextErrors.role) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as {
        errors?: { message?: string }[];
      } | null;

      if (!response.ok) {
        throw new Error(data?.errors?.[0]?.message ?? "Failed to create account");
      }

      notifications.show({
        title: "Account created",
        message: "Share the email and password with the employee.",
        color: "green",
      });
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      notifications.show({
        title: "Create account failed",
        message:
          error instanceof Error ? error.message : "Failed to create account",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Box
          style={{
            borderBottom: "1px solid var(--ds-border-color)",
            paddingBottom: "var(--ds-spacing-4)",
          }}
        >
          <Title order={1}>Admin Dashboard</Title>
          <Text c="dimmed">
            Manage employee access and monitor platform readiness from one
            admin-only workspace.
          </Text>
        </Box>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" verticalSpacing="lg">
          <Paper withBorder radius={8} p="lg">
            <Stack gap="md">
              <Group gap="sm" wrap="nowrap">
                <IconUserPlus size={24} color="var(--ds-primary)" />
                <Box>
                  <Title order={2} size="h3">
                    Create employee account
                  </Title>
                  <Text size="sm" c="dimmed">
                    Create credentials for a new employee. Role approval and
                    workspace access stay controlled by admin policy.
                  </Text>
                </Box>
              </Group>

              <form onSubmit={handleSubmit}>
                <Stack gap="var(--ds-spacing-4)">
                  <Input
                    label="Employee email"
                    placeholder="employee@example.com"
                    required
                    value={values.email}
                    error={errors.email}
                    onChange={(value) =>
                      setValues((current) => ({
                        ...current,
                        email: typeof value === "string" ? value : "",
                      }))
                    }
                  />

                  <Input
                    label="Temporary password"
                    placeholder="Minimum 8 characters"
                    required
                    masked
                    value={values.password}
                    error={errors.password}
                    onChange={(value) =>
                      setValues((current) => ({
                        ...current,
                        password: typeof value === "string" ? value : "",
                      }))
                    }
                  />

                  <SelectDropdown
                    label="Employee role"
                    placeholder="Select role"
                    allowNone={false}
                    choices={EMPLOYEE_ACCOUNT_ROLES.map((role) => ({
                      value: role.value,
                      text: role.label,
                    }))}
                    value={values.role || null}
                    onChange={(value) =>
                      setValues((current) => ({
                        ...current,
                        role: (value ?? "") as AccountValues["role"],
                      }))
                    }
                  />
                  {errors.role ? (
                    <Text size="xs" c="red">
                      {errors.role}
                    </Text>
                  ) : values.role ? (
                    <Text size="xs" c="dimmed">
                      {
                        EMPLOYEE_ACCOUNT_ROLES.find(
                          (role) => role.value === values.role
                        )?.description
                      }
                    </Text>
                  ) : null}

                  <Button
                    type="submit"
                    color="cta"
                    loading={loading}
                    leftSection={<IconUserPlus size={18} />}
                  >
                    Create account
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>

          <SystemHealthWidget />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
