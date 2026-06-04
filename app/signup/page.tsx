"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Input } from "@/components/ui";

interface SignupValues {
  email: string;
  password: string;
}

interface SignupErrors {
  email?: string;
  password?: string;
}

const initialValues: SignupValues = {
  email: "",
  password: "",
};

function validateSignup(values: SignupValues): SignupErrors {
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
  };
}

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<SignupValues>(initialValues);
  const [errors, setErrors] = useState<SignupErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSignup(values);
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || "Signup failed");
      }

      notifications.show({
        title: "Account created",
        message: "Your account is waiting for admin approval.",
        color: "green",
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      notifications.show({
        title: "Signup error",
        message: error instanceof Error ? error.message : "Failed to create account",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ds-spacing-6)",
        background: "var(--ds-surface-white)",
      }}
    >
      <Box style={{ width: "100%", maxWidth: 400 }}>
        <Title order={1} style={{ color: "var(--ds-primary)" }}>
          Create your Controme account
        </Title>
        <Text c="var(--ds-text-muted)" size="sm" mt="var(--ds-spacing-1)">
          Use your own email and password. New accounts wait for admin approval
          before accessing production workspaces.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap="var(--ds-spacing-4)" mt="var(--ds-spacing-6)">
            <Input
              label="Email"
              placeholder="you@example.com"
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
              label="Password"
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

            <Button type="submit" fullWidth loading={loading} color="cta">
              Create Account
            </Button>
          </Stack>
        </form>

        <Group justify="center" gap={6} mt="var(--ds-spacing-4)">
          <Text size="sm" c="var(--ds-text-muted)">
            Already have an account?
          </Text>
          <Text
            component={Link}
            href="/login"
            size="sm"
            fw={700}
            style={{ color: "var(--ds-primary)", textDecoration: "none" }}
          >
            Log in
          </Text>
        </Group>
      </Box>
    </Box>
  );
}
