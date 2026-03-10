import { model } from "@medusajs/framework/utils"

const VariantDigitalAssetLink = model.define("variant_digital_asset_link", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  digital_asset_id: model.text(),
})

export default VariantDigitalAssetLink
