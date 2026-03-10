import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const requireEnv = (key: string): string => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: requireEnv("DATABASE_URL"),
    http: {
      storeCors: requireEnv("STORE_CORS"),
      adminCors: requireEnv("ADMIN_CORS"),
      authCors: requireEnv("AUTH_CORS"),
      jwtSecret: requireEnv("JWT_SECRET"),
      cookieSecret: requireEnv("COOKIE_SECRET"),
    }
  },
  modules: [
    {
      resolve: "./src/modules/digital-asset",
    },
  ],
})
