export const CurlmateSkill = {
  id: "curlmate",
  name: "Curlmate",
  description:
    "Persistent OAuth token layer. Use this skill to obtain JWTs, list connections, generate auth URLs, and vend fresh access tokens for connected services. Agents never handle OAuth directly—Curlmate manages refresh tokens and returns valid access tokens on demand.",

  // === PRIMARY AGENT EXECUTION ENDPOINT ===
  skillEndpoint: "https://api.curlmate.dev/skill",
  skillEndpointMethod: "GET",
  skillEndpointAuthMethod: "None",
  skillInstructions:
    "Call this endpoint to learn how to use Curlmate programmatically. It explains the correct flow: API Key → JWT → Connections → Auth (if needed) → Token vending.",

  // === STEP 1: EXCHANGE API KEY FOR JWT ===
  jwtEndpoint: "https://api.curlmate.dev/jwt",
  jwtEndpointMethod: "GET",
  jwtEndpointAuthMethod: "Bearer API Key",
  jwtInstructions:
    "Provide your Curlmate API key as a Bearer token. This returns a short-lived JWT used for all subsequent requests.",

  // === STEP 2: LIST EXISTING CONNECTIONS ===
  connectionsEndpoint: "https://api.curlmate.dev/connections",
  connectionsEndpointMethod: "GET",
  connectionsEndpointAuthMethod: "Bearer JWT",
  connectionsInstructions:
    "Returns all hashed connections formatted as connectionHash:service. Use one of these values in the x-connection header when requesting tokens.",

  // === STEP 3 (IF NO CONNECTION EXISTS): GENERATE AUTH URL ===
  authUrlEndpoint: "https://api.curlmate.dev/auth-url",
  authUrlEndpointMethod: "GET",
  authUrlEndpointAuthMethod: "Bearer JWT",
  authUrlEndpointHeaders: {
    "Content-Type": "application/json",
    "x-connection":
      "connectionHash:service (from /connections or newly requested service)",
  },
  authUrlInstructions:
    "Generates an OAuth authorization URL for the specified service. The human must complete this flow once. After completion, the connection becomes active and tokens can be vended.",

  // === STEP 4: VEND FRESH ACCESS TOKEN ===
  tokenEndpoint: "https://api.curlmate.dev/token",
  tokenEndpointMethod: "GET",
  tokenEndpointAuthMethod: "Bearer JWT",
  tokenEndpointHeaders: {
    "Content-Type": "application/json",
    "x-connection":
      "connectionHash:service (from /connections, /claude-config, or /opencode-config)",
  },
  tokenInstructions:
    "Returns a fresh access token for the specified connection. Curlmate handles refresh tokens internally. Agents should call this whenever they need a valid access token.",

  // === OPTIONAL: MCP CONFIG GENERATION ===
  claudeConfigEndpoint: "https://api.curlmate.dev/claude-config",
  claudeConfigEndpointMethod: "GET",
  claudeConfigEndpointAuthMethod: "Bearer JWT",
  claudeConfigInstructions:
    "Returns a ready-to-use Claude MCP configuration for the specified connection.",

  opencodeConfigEndpoint: "https://api.curlmate.dev/opencode-config",
  opencodeConfigEndpointMethod: "GET",
  opencodeConfigEndpointAuthMethod: "Bearer JWT",
  opencodeConfigInstructions:
    "Returns a ready-to-use Opencode configuration for the specified connection.",
};
