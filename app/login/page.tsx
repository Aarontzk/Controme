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
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  Text,
  Title,
  UnstyledButton
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import darkLogo from "@/assets/dark logo.png";
import lightLogo from "@/assets/light logo.png";
import heroLogin from "@/assets/hero login.png";
import { Input } from "@/components/ui";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { DEMO_ACCOUNTS, DEMO_LOGIN_ENABLED } from "@/lib/auth/demo-accounts";
import {
  removeRecentAccount,
  saveRecentAccount,
} from "@/lib/auth/recent-accounts";

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

function getInitialLoginValues(): LoginValues {
  if (typeof window === "undefined") return initialValues;

  const email = new URLSearchParams(window.location.search).get("email");
  return {
    email: email ?? "",
    password: "",
  };
}

function getInitialRememberMe(): boolean {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).get("remember") === "1";
}

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
  const [values, setValues] = useState<LoginValues>(getInitialLoginValues);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [rememberMe, setRememberMe] = useState(getInitialRememberMe);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("error");
    if (!message) return;

    notifications.show({
      title: "Authentication error",
      message,
      color: "red",
    });
  }, []);

  const handleLogin = async (
    loginValues: LoginValues,
    options: { remember?: boolean } = {},
  ) => {
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

      if (options.remember) {
        saveRecentAccount({ email: loginValues.email });
      } else {
        removeRecentAccount(loginValues.email);
      }
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

    void handleLogin(values, { remember: rememberMe });
  };

  return (
    <Box
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        background: "var(--ds-surface-white)"
      }}
    >
      {/* ── Left: lab hero with deep-green overlay (md and up) ── */}
      <Box
        visibleFrom="md"
        style={{
          position: "relative",
          flex: "1 1 0",
          overflow: "hidden"
        }}
      >
        <Image
          src={heroLogin}
          alt="Controme QC laboratory"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: "cover" }}
        />
        <Box
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, rgba(0,72,56,0.92) 0%, rgba(0,77,62,0.82) 45%, rgba(0,48,38,0.78) 100%)"
          }}
        />
        <Stack
          justify="flex-end"
          gap="var(--ds-spacing-4)"
          style={{
            position: "relative",
            height: "100%",
            padding: "var(--ds-spacing-12)"
          }}
        >
          <Image
            src={lightLogo}
            alt="Controme"
            width={196}
            priority
            style={{ height: "auto", width: "min(196px, 40%)" }}
          />
          <Title
            order={2}
            style={{ color: "#ffffff", maxWidth: "18ch", lineHeight: 1.15 }}
          >
            AI-Powered QC &amp; Operations Platform
          </Title>
          <Text
            size="sm"
            style={{ color: "rgba(255,255,255,0.82)", maxWidth: "44ch" }}
          >
            Objective consistency and automated audit trails for Sima Arome&apos;s
            export quality standards.
          </Text>
        </Stack>
      </Box>

      {/* ── Right: sign-in form ── */}
      <Box
        style={{
          flex: "1 1 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--ds-spacing-6)",
          overflowY: "auto"
        }}
      >
        <Box style={{ width: "100%", maxWidth: 400 }}>
          <Box hiddenFrom="md" mb="var(--ds-spacing-6)">
            <Image
              src={darkLogo}
              alt="Controme"
              width={150}
              priority
              style={{ height: "auto", width: "150px" }}
            />
          </Box>

          <Title order={1} style={{ color: "var(--ds-primary)" }}>
            Log in to Controme
          </Title>
          <Text c="var(--ds-text-muted)" size="sm" mt="var(--ds-spacing-1)">
            Please sign in to continue.
          </Text>

          {DEMO_LOGIN_ENABLED ? (
            <Stack gap="var(--ds-spacing-2)" mt="var(--ds-spacing-6)">
              <SelectDropdown
                label="Demo quick login"
                placeholder="Pick a role to sign in"
                choices={DEMO_ACCOUNTS.map((account) => ({
                  value: account.id,
                  text: account.label
                }))}
                value={null}
                allowNone={false}
                onChange={(value) => {
                  const account = DEMO_ACCOUNTS.find((item) => item.id === value);
                  if (!account || loading) return;
                  setErrors({});
                  setValues({ email: account.email, password: account.password });
                  void handleLogin({
                    email: account.email,
                    password: account.password
                  });
                }}
              />
              <Text size="xs" c="var(--ds-text-muted)">
                Demo accounts — fills credentials and signs in automatically.
              </Text>
              <Divider
                label="or sign in manually"
                labelPosition="center"
                mt="var(--ds-spacing-1)"
              />
            </Stack>
          ) : (
            <Box mt="var(--ds-spacing-6)" />
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="var(--ds-spacing-4)">
              <Input
                label="Employee ID / Email"
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
                placeholder="Enter your password.."
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

              <UnstyledButton
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((current) => !current)}
                style={{
                  alignItems: "center",
                  display: "flex",
                  gap: "var(--ds-spacing-2)",
                  width: "fit-content",
                }}
              >
                <Box
                  style={{
                    alignItems: "center",
                    background: rememberMe
                      ? "var(--ds-primary)"
                      : "var(--mantine-color-body)",
                    border: rememberMe
                      ? "1px solid var(--ds-primary)"
                      : "1px solid var(--ds-border-color)",
                    borderRadius: 4,
                    color: "#ffffff",
                    display: "flex",
                    height: 18,
                    justifyContent: "center",
                    width: 18,
                  }}
                >
                  {rememberMe ? <IconCheck size={13} stroke={3} /> : null}
                </Box>
                <Text size="sm" fw={600}>
                  Remember this account
                </Text>
              </UnstyledButton>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                color="cta"
                mt="var(--ds-spacing-2)"
              >
                Log In
              </Button>
            </Stack>
          </form>

          <Text
            size="sm"
            c="var(--ds-text-muted)"
            ta="center"
            mt="var(--ds-spacing-4)"
          >
            Need an account? Contact an administrator.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
