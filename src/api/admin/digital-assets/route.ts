import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_ASSET_MODULE } from "../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../modules/digital-asset/service"

type CreateDigitalAssetBody = {
  title: string
  file_url: string
  file_name?: string | null
  mime_type?: string | null
  storage_provider?: string
  is_active?: boolean
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )

  const assets = await service.listDigitalAssets({}, { order: { created_at: "DESC" } })

  res.status(200).json({
    digital_assets: assets,
  })
}

export async function POST(
  req: MedusaRequest<CreateDigitalAssetBody>,
  res: MedusaResponse
) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )

  const { title, file_url, file_name, mime_type, storage_provider, is_active } =
    req.body

  if (!title || !file_url) {
    return res.status(400).json({
      message: "`title` and `file_url` are required.",
    })
  }

  const [asset] = await service.createDigitalAssets([
    {
      title,
      file_url,
      file_name: file_name ?? null,
      mime_type: mime_type ?? null,
      storage_provider: storage_provider ?? "external",
      is_active: is_active ?? true,
    },
  ])

  res.status(201).json({
    digital_asset: asset,
  })
}
