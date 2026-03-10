import { model } from "@medusajs/framework/utils"

const DigitalAsset = model.define("digital_asset", {
  id: model.id().primaryKey(),
  title: model.text(),
  file_url: model.text(),
  file_name: model.text().nullable(),
  mime_type: model.text().nullable(),
  storage_provider: model.text().default("external"),
  is_active: model.boolean().default(true),
})

export default DigitalAsset
