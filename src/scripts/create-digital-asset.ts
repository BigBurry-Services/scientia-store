import { ExecArgs } from "@medusajs/framework/types"
import { DIGITAL_ASSET_MODULE } from "../modules/digital-asset"
import DigitalAssetModuleService from "../modules/digital-asset/service"

export default async function createDigitalAsset({ container, args }: ExecArgs) {
  const logger = container.resolve("logger")
  const service: DigitalAssetModuleService = container.resolve(
    DIGITAL_ASSET_MODULE
  )

  const title = args?.[0]
  const fileUrl = args?.[1]
  const variantId = args?.[2]

  if (!title || !fileUrl) {
    logger.error(
      "Usage: npx medusa exec ./src/scripts/create-digital-asset.ts <title> <file_url> [variant_id]"
    )
    return
  }

  const [asset] = await service.createDigitalAssets([
    {
      title,
      file_url: fileUrl,
      storage_provider: "external",
      is_active: true,
    },
  ])

  logger.info(`Created digital asset: ${asset.id} (${asset.title})`)

  if (variantId) {
    const link = await service.attachAssetToVariant({
      digital_asset_id: asset.id,
      variant_id: variantId,
    })
    logger.info(
      `Attached asset ${asset.id} to variant ${variantId}. Link: ${link.id}`
    )
  }
}
