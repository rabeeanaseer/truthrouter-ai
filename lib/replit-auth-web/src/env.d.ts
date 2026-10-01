interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_AUTH_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}