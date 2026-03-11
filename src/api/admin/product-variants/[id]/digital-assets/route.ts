import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { DIGITAL_ASSET_MODULE } from "../../../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../../../modules/digital-asset/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { id: variantId } = req.params

  const [allAssets, links] = await Promise.all([
    service.listDigitalAssets({}, { order: { created_at: "DESC" } }),
    service.listVariantDigitalAssetLinks({ variant_id: variantId }),
  ])

  const attachedAssetIds = new Set(links.map((link) => link.digital_asset_id))
  const attachedAssets = allAssets.filter((asset) => attachedAssetIds.has(asset.id))
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory.id", "inventory_items.inventory.requires_shipping"],
    filters: {
      id: variantId,
    },
  })

  const variant = (variants?.[0] || null) as
    | {
        inventory_items?: Array<{
          inventory?: {
            id?: string
            requires_shipping?: boolean
          } | null
        }>
      }
    | null

  const firstInventory = variant?.inventory_items?.[0]?.inventory || null

  res.status(200).json({
    variant_id: variantId,
    attached_assets: attachedAssets,
    all_assets: allAssets,
    links,
    inventory_item: firstInventory
      ? {
          id: firstInventory.id || null,
          requires_shipping:
            typeof firstInventory.requires_shipping === "boolean"
              ? firstInventory.requires_shipping
              : null,
        }
      : null,
  })
}

type UpdateVariantShippingBody = {
  requires_shipping?: boolean
}

export async function POST(
  req: MedusaRequest<UpdateVariantShippingBody>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
  const { id: variantId } = req.params
  const { requires_shipping } = req.body || {}

  if (typeof requires_shipping !== "boolean") {
    return res.status(400).json({
      message: "`requires_shipping` (boolean) is required.",
    })
  }

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory.id"],
    filters: {
      id: variantId,
    },
  })

  const variant = (variants?.[0] || null) as
    | {
        inventory_items?: Array<{
          inventory?: {
            id?: string
          } | null
        }>
      }
    | null

  const inventoryId = variant?.inventory_items?.[0]?.inventory?.id

  if (!inventoryId) {
    return res.status(400).json({
      message:
        "No inventory item found for this variant. Enable inventory tracking first, then try again.",
    })
  }

  const updated = await inventoryModuleService.updateInventoryItems({
    id: inventoryId,
    requires_shipping,
  })

  return res.status(200).json({
    inventory_item: {
      id: updated.id,
      requires_shipping: updated.requires_shipping,
    },
  })
}
