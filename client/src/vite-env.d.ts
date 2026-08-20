/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Absolute base for API calls, e.g. `https://api.example.com`.
   * Empty (the default) means relative `/api/...` paths through the Vite proxy,
   * which keeps the session cookie same-origin. See `client/.env.example`.
   */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
