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
    ...(process.env.RAZORPAY_ID && process.env.RAZORPAY_SECRET
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@devx-commerce/razorpay/providers/payment-razorpay",
                  id: "razorpay",
                  options: {
                    key_id: process.env.RAZORPAY_ID,
                    key_secret: process.env.RAZORPAY_SECRET,
                    razorpay_account: process.env.RAZORPAY_ACCOUNT,
                    webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
                    auto_capture: true,
                    refund_speed: "normal",
                    automatic_expiry_period: 30,
                    manual_expiry_period: 20,
                  },
                },
              ],
            },
          },
        ]
      : []),
    {
      resolve: "./src/modules/digital-asset",
    },
  ],
})
