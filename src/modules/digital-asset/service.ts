import { MedusaService } from "@medusajs/framework/utils"
import DigitalAsset from "./models/digital-asset"
import VariantDigitalAssetLink from "./models/variant-digital-asset-link"

class DigitalAssetModuleService extends MedusaService({
  DigitalAsset,
  VariantDigitalAssetLink,
}) {
  async attachAssetToVariant(input: {
    digital_asset_id: string
    variant_id: string
  }) {
    const existing = await this.listVariantDigitalAssetLinks(
      {
        digital_asset_id: input.digital_asset_id,
        variant_id: input.variant_id,
      }
    )

    if (existing.length) {
      return existing[0]
    }

    const created = await this.createVariantDigitalAssetLinks([input])

    return created[0]
  }

  async listAssetsForVariantIds(variantIds: string[]) {
    if (!variantIds.length) {
      return []
    }

    const uniqueVariantIds = new Set(variantIds)
    const allLinks = await this.listVariantDigitalAssetLinks({})
    const links = allLinks.filter((link) => uniqueVariantIds.has(link.variant_id))

    if (!links.length) {
      return []
    }

    const uniqueAssetIds = new Set(links.map((link) => link.digital_asset_id))
    const allAssets = await this.listDigitalAssets({ is_active: true })
    const assets = allAssets.filter((asset) => uniqueAssetIds.has(asset.id))

    const assetMap = new Map(assets.map((asset) => [asset.id, asset]))

    return links
      .map((link) => ({
        variant_id: link.variant_id,
        asset: assetMap.get(link.digital_asset_id),
      }))
      .filter((entry) => !!entry.asset)
  }
}

export default DigitalAssetModuleService
