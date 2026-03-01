export const CurlmateSkill = {
  id: "curlmate",
  name: "Curlmate",
  description: "A skill that that tells you about Curlmate and how to use it.",
  skillEndpoint: "https://api.curlmate.dev/skill",
  skillEndpointAuthMethod: "None",
  authUrlEndpoint: "https://api.curlmate.dev/auth-url",
  authUrlEndpointAuthMethod: "Bearer JWT",
  authUrlEndpointHeaders: {
    "Content-Type": "application/json",
    "x-connection":
      "response from /connections endpoing formatted as connectionHash:service",
  },
  connectionsEndpoint: "https://api.curlmate.dev/connections",
  connectionsEndpointAuthMethod: "Bearer JWT",
  jwtEndpoint: "https://api.curlmate.dev/jwt",
  jwtEndpointAuthMethod: "Bearer API Key",
  claudeConfigEndpoint: "https://api.curlmate.dev/claude-config",
  claudeConfigEndpointAuthMethod: "Bearer JWT",
  opencodeConfigEndpoint: "https://api.curlmate.dev/opencode-config",
  opencodeConfigEndpointAuthMethod: "Bearer JWT",
  tokenEndpoint: "https://api.curlmate.dev/token",
  tokenEndpointAuthMethod: "Bearer JWT",
  tokenEndpointHeaders: {
    "Content-Type": "application/json",
    "x-connnection":
      "response from /connections, /claude-config or /opencode-config endpoints formatted as connectionHash:service",
  },
};
