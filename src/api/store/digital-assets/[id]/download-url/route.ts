import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_ASSET_MODULE } from "../../../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../../../modules/digital-asset/service"
import { getPurchasedLineItems } from "../../helpers"

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
  const { id } = req.params

  const asset = await service.retrieveDigitalAsset(id).catch(() => null)

  if (!asset || !asset.is_active) {
    return res.status(404).json({
      message: "Digital asset not found.",
    })
  }

  const links = await service.listVariantDigitalAssetLinks({
    digital_asset_id: id,
  })
  const allowedVariantIds = new Set(links.map((link) => link.variant_id))

  if (!allowedVariantIds.size) {
    return res.status(403).json({
      message: "This asset is not attached to any purchasable variant.",
    })
  }

  const purchasedLineItems = await getPurchasedLineItems(req.scope, customerId)
  const hasPurchasedAsset = purchasedLineItems.some(
    (item) => item.variant_id && allowedVariantIds.has(item.variant_id)
  )

  if (!hasPurchasedAsset) {
    return res.status(403).json({
      message: "You are not entitled to download this asset.",
    })
  }

  const shouldDownload = String((req.query as any)?.download || "") === "1"

  if (shouldDownload) {
    const remoteRes = await fetch(asset.file_url)

    if (!remoteRes.ok) {
      return res.status(502).json({
        message: "Failed to fetch asset from storage provider.",
      })
    }

    const buffer = Buffer.from(await remoteRes.arrayBuffer())
    const fallbackName = `${asset.id}.bin`
    const fileName = (asset.file_name || fallbackName).replace(/"/g, "")
    const contentType =
      asset.mime_type ||
      remoteRes.headers.get("content-type") ||
      "application/octet-stream"

    res.setHeader("content-type", contentType)
    res.setHeader("content-length", String(buffer.length))
    res.setHeader("content-disposition", `attachment; filename="${fileName}"`)

    return res.status(200).send(buffer)
  }

  res.status(200).json({
    digital_asset_id: asset.id,
    file_url: asset.file_url,
    file_name: asset.file_name,
    mime_type: asset.mime_type,
  })
}
