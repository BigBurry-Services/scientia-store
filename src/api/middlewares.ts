import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/digital-assets*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/product-variants/:id/digital-assets*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/store/digital-assets/my-downloads",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/digital-assets/:id/download-url",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
