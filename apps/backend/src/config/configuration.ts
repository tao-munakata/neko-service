export default () => ({
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    bucket: process.env.MINIO_BUCKET || 'neko-media',
    rootUser: process.env.MINIO_ROOT_USER || 'minioadmin',
    rootPassword: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});
