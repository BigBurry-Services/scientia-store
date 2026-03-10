import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_ASSET_MODULE } from "../../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../../modules/digital-asset/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )

  const { id } = req.params

  const asset = await service.retrieveDigitalAsset(id).catch(() => null)

  if (!asset) {
    return res.status(404).json({
      message: "Digital asset not found.",
    })
  }

  const links = await service.listVariantDigitalAssetLinks({
    digital_asset_id: id,
  })

  res.status(200).json({
    digital_asset: asset,
    variant_links: links,
  })
}
