/**
 * @buildpad-origin @buildpad/cli/api-routes/login-page
 * @buildpad-version 1.0.0
 *
 * This file was copied from Buildpad UI Packages.
 * To update, run: npx @buildpad/cli add api-routes/login-page --overwrite
 *
 * Docs: https://buildpad.dev/components/api-routes/login-page
 */

/**
 * Login Page Template
 *
 * Server-side proxy login page that uses the /api/auth/login proxy route
 * instead of calling Supabase directly from the browser.
 * This avoids CORS issues in the two-tier architecture.
 *
 * Pattern: Browser -> /api/auth/login (same origin) -> Supabase Auth (server-side)
 *
 * @buildpad/origin: pages/login
 * @buildpad/version: 1.0.0
 */

"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import { useRouter } from "next/navigation";
import darkLogo from "@/assets/dark logo.png";
import { Input } from "@/components/ui";

interface LoginValues {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

const initialValues: LoginValues = {
  email: "",
  password: ""
};

function validateLogin(values: LoginValues): LoginErrors {
  return {
    email: !values.email
      ? "Email is required"
      : /^\S+@\S+$/.test(values.email)
        ? undefined
        : "Invalid email",
    password: values.password ? undefined : "Password is required"
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [errors, setErrors] = useState<LoginErrors>({});

  const handleLogin = async (loginValues: LoginValues) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginValues),
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || "Login failed");
      }

      notifications.show({
        title: "Success",
        message: "Logged in successfully",
        color: "green"
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to login",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    void handleLogin(values);
  };

  return (
    <Box
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, var(--ds-surface-deep) 0%, var(--ds-surface-base) 58%, var(--ds-primary-muted) 100%)"
      }}
    >
      <Container size={420} px="var(--ds-spacing-4)">
        <Stack align="center" gap="var(--ds-spacing-3)" mb="var(--ds-spacing-6)">
          <Image
            src={darkLogo}
            alt="Controme"
            width={142}
            priority
            style={{
              height: "auto",
              width: "min(142px, 52vw)"
            }}
          />
          <Title ta="center" order={1}>
            Welcome back
          </Title>
          <Text c="var(--ds-text-muted)" size="sm" ta="center">
            Sign in to your account
          </Text>
        </Stack>

        <Paper
          withBorder
          shadow="lg"
          radius="md"
          style={{
            background: "var(--ds-surface-white)",
            borderColor: "var(--ds-border-color)",
            padding: "var(--ds-spacing-8)"
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="var(--ds-spacing-4)">
              <Input
                label="Email"
                placeholder="you@example.com"
                required
                value={values.email}
                error={errors.email}
                onChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    email: typeof value === "string" ? value : ""
                  }))
                }
              />

              <Input
                label="Password"
                placeholder="Your password"
                required
                masked
                value={values.password}
                error={errors.password}
                onChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    password: typeof value === "string" ? value : ""
                  }))
                }
              />

              <Button type="submit" fullWidth loading={loading} color="cta">
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
