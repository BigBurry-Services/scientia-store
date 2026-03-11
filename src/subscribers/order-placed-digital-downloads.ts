import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { DIGITAL_ASSET_MODULE } from "../modules/digital-asset"
import DigitalAssetModuleService from "../modules/digital-asset/service"

type OrderGraphItem = {
  id: string
  title?: string | null
  variant_id?: string | null
}

type OrderGraphRecord = {
  id: string
  display_id?: number | null
  email?: string | null
  customer_id?: string | null
  payment_status?: string | null
  items?: OrderGraphItem[]
}

type DigitalAssetRecord = {
  id: string
  title: string
}

const PAID_STATUSES = new Set([
  "captured",
  "partially_captured",
  "authorized",
  "partially_authorized",
])

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const resolveStorefrontUrl = () => {
  if (process.env.STOREFRONT_URL) {
    return stripTrailingSlash(process.env.STOREFRONT_URL.trim())
  }

  const storeCors = process.env.STORE_CORS || ""
  const firstStoreOrigin = storeCors
    .split(",")
    .map((part) => part.trim())
    .find(Boolean)

  return firstStoreOrigin
    ? stripTrailingSlash(firstStoreOrigin)
    : "http://localhost:8000"
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export default async function orderPlacedDigitalDownloadsSubscriber({
  event,
  container,
}: SubscriberArgs<{ id?: string }>) {
  const orderId = event.data?.id

  if (!orderId) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    error: (message: string) => void
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const digitalAssetService: DigitalAssetModuleService =
    container.resolve(DIGITAL_ASSET_MODULE)

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "customer_id",
      "payment_status",
      "items.id",
      "items.title",
      "items.variant_id",
    ],
    filters: { id: orderId },
  })

  const order = (data?.[0] || null) as OrderGraphRecord | null

  if (!order?.email) {
    return
  }

  const variantIds = (order.items || [])
    .map((item) => item.variant_id)
    .filter((id): id is string => !!id)

  if (!variantIds.length) {
    return
  }

  const variantAssetPairs = (await digitalAssetService.listAssetsForVariantIds(
    variantIds
  )) as Array<{ variant_id: string; asset: DigitalAssetRecord }>

  if (!variantAssetPairs.length) {
    return
  }

  const storefrontUrl = resolveStorefrontUrl()
  const downloadsPageUrl = `${storefrontUrl}/account/downloads`
  const paidNow = PAID_STATUSES.has((order.payment_status || "").toLowerCase())

  const variantAssetMap = new Map<string, DigitalAssetRecord>(
    variantAssetPairs.map((entry) => [entry.variant_id, entry.asset])
  )

  const downloads = (order.items || [])
    .map((item) => {
      const variantId = item.variant_id || ""
      const asset = variantAssetMap.get(variantId)

      if (!asset) {
        return null
      }

      return {
        itemTitle: item.title || asset.title,
        assetTitle: asset.title,
        downloadUrl: `${storefrontUrl}/api/digital-assets/${asset.id}/download`,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => !!entry)

  if (!downloads.length) {
    return
  }

  const uniqueDownloads = Array.from(
    new Map(downloads.map((entry) => [entry.downloadUrl, entry])).values()
  )

  const orderLabel = order.display_id ? `#${order.display_id}` : order.id
  const paymentNote = paidNow
    ? "Your download links are ready."
    : "Your links will work after payment is captured."

  const textLines = [
    `Thank you for your purchase from Scientia Academy.`,
    ``,
    `Order: ${orderLabel}`,
    paymentNote,
    ``,
    `Downloads page: ${downloadsPageUrl}`,
    ``,
    ...uniqueDownloads.map(
      (entry) => `- ${entry.itemTitle}: ${entry.downloadUrl}`
    ),
    ``,
    `Note: Please sign in with the same customer account used for this order.`,
  ]

  const listHtml = uniqueDownloads
    .map(
      (entry) =>
        `<li><strong>${escapeHtml(entry.itemTitle)}</strong>: <a href="${escapeHtml(
          entry.downloadUrl
        )}">${escapeHtml(entry.assetTitle)}</a></li>`
    )
    .join("")

  const html = `
    <p>Thank you for your purchase from Scientia Academy.</p>
    <p><strong>Order:</strong> ${escapeHtml(orderLabel)}<br/>${escapeHtml(
    paymentNote
  )}</p>
    <p><a href="${escapeHtml(
      downloadsPageUrl
    )}">Open your Downloads page</a></p>
    <p>Direct download links:</p>
    <ul>${listHtml}</ul>
    <p>Please sign in with the same customer account used for this order.</p>
  `

  try {
    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      content: {
        subject: `Your digital downloads for order ${orderLabel}`,
        text: textLines.join("\n"),
        html,
      },
      data: {
        order_id: order.id,
        order_display_id: order.display_id,
        downloads_page_url: downloadsPageUrl,
        downloads: uniqueDownloads,
      },
      trigger_type: "order.placed",
      resource_id: order.id,
      resource_type: "order",
      receiver_id: order.customer_id || null,
      idempotency_key: `order.placed.digital-downloads:${order.id}`,
    })
  } catch (e) {
    logger.error(
      `[order-placed-digital-downloads] Failed to send email for order ${order.id}: ${(e as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "order-placed-digital-downloads",
  },
}
