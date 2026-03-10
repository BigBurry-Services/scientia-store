import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_ASSET_MODULE } from "../../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../../modules/digital-asset/service"
import { getPurchasedLineItems } from "../helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({
      message: "You must be logged in as a customer.",
    })
  }

  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )

  const purchasedLineItems = await getPurchasedLineItems(req.scope, customerId)
  const purchasedVariantIds = purchasedLineItems
    .map((item) => item.variant_id)
    .filter((id): id is string => !!id)

  if (!purchasedVariantIds.length) {
    return res.status(200).json({
      downloads: [],
    })
  }

  const variantAssetPairs = await service.listAssetsForVariantIds(
    purchasedVariantIds
  )
  const assetByVariantId = new Map(
    variantAssetPairs.map((entry) => [entry.variant_id, entry.asset])
  )

  const downloads = purchasedLineItems
    .map((item) => {
      const asset = item.variant_id
        ? assetByVariantId.get(item.variant_id) || null
        : null

      if (!asset) {
        return null
      }

      return {
        order_id: item.order_id,
        line_item_id: item.line_item_id,
        line_item_title: item.line_item_title,
        variant_id: item.variant_id,
        digital_asset: {
          id: asset.id,
          title: asset.title,
          file_name: asset.file_name,
          mime_type: asset.mime_type,
        },
      }
    })
    .filter(Boolean)

  res.status(200).json({
    downloads,
  })
}
