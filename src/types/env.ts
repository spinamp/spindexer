declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DEFAULT_ADMIN_ADDRESS: string;
    }
  }
}
export { }
