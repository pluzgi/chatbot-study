/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_API_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
