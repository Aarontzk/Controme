/**
 * OAuth provider configuration (placeholder).
 *
 * This project does not yet integrate an external OAuth/OIDC identity provider.
 * The auth logout route imports `getProviderConfig` + `buildLogoutUrl` to perform
 * IdP Single Logout (SLO) when a user signed in via an external provider. Until
 * `/add-external-oauth` is run (which overwrites this file with the full
 * implementation), these are minimal no-ops: no provider is configured, so
 * logout signs out of Supabase and clears cookies without an IdP redirect.
 */

export interface ProviderOAuthConfig {
  provider: string;
  /** IdP end-session endpoint, if the provider supports SLO. */
  logoutUrl?: string;
  /** Query param the IdP uses for the post-logout redirect URI. */
  logoutRedirectParam?: string;
}

/**
 * Resolve the OAuth config for a provider. No external providers are configured,
 * so this always throws — the logout route catches it and skips SLO.
 */
export function getProviderConfig(provider: string): ProviderOAuthConfig {
  throw new Error(
    `OAuth provider '${provider}' is not configured. Run /add-external-oauth to enable external sign-in.`,
  );
}

/**
 * Build the IdP end-session URL for SLO. Returns null when the provider has no
 * configured logout endpoint (the current placeholder always returns null).
 */
export function buildLogoutUrl(
  config: ProviderOAuthConfig,
  postLogoutUri: string,
): string | null {
  if (!config.logoutUrl) {
    return null;
  }

  const url = new URL(config.logoutUrl);
  if (config.logoutRedirectParam) {
    url.searchParams.set(config.logoutRedirectParam, postLogoutUri);
  }
  return url.toString();
}
