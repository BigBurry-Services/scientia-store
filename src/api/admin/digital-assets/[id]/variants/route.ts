import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { DIGITAL_ASSET_MODULE } from "../../../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../../../modules/digital-asset/service"

type AttachVariantBody = {
  variant_id: string
}

export async function POST(
  req: MedusaRequest<AttachVariantBody>,
  res: MedusaResponse
) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )
  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { id } = req.params
  const { variant_id } = req.body

  if (!variant_id) {
    return res.status(400).json({
      message: "`variant_id` is required.",
    })
  }

  const asset = await service.retrieveDigitalAsset(id).catch(() => null)

  if (!asset) {
    return res.status(404).json({
      message: "Digital asset not found.",
    })
  }

  // Validate that the variant exists in the product module.
  const variant = await productModuleService
    .retrieveProductVariant(variant_id)
    .catch(() => null)

  if (!variant) {
    return res.status(404).json({
      message: "Product variant not found.",
    })
  }

  const existingLinks = await service.listVariantDigitalAssetLinks({
    variant_id,
  })

  const link = await service.setAssetForVariant({
    digital_asset_id: id,
    variant_id,
  })

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "variants.id", "variants.title"],
    filters: {
      variants: {
        id: variant_id,
      },
    },
  })

  res.status(200).json({
    variant_link: link,
    replaced_asset_count: existingLinks.filter(
      (link) => link.digital_asset_id !== id
    ).length,
    variant: {
      id: variant.id,
      title: variant.title,
    },
    product: products?.[0] ?? null,
  })
}

export async function DELETE(
  req: MedusaRequest<AttachVariantBody>,
  res: MedusaResponse
) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )

  const { id } = req.params
  const { variant_id } = req.body

  if (!variant_id) {
    return res.status(400).json({
      message: "`variant_id` is required.",
    })
  }

  const removedCount = await service.detachAssetFromVariant({
    digital_asset_id: id,
    variant_id,
  })

  return res.status(200).json({
    removed_count: removedCount,
  })
}
