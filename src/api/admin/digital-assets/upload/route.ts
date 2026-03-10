import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_ASSET_MODULE } from "../../../../modules/digital-asset"
import DigitalAssetModuleService from "../../../../modules/digital-asset/service"
import { uploadToSupabaseStorage } from "../../../../lib/supabase-storage"

const readRawBody = async (
  req: MedusaRequest,
  maxBytes = 100 * 1024 * 1024
) => {
  const chunks: Buffer[] = []
  let total = 0

  for await (const chunk of req as any) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length

    if (total > maxBytes) {
      throw new Error("File too large. Max supported size is 100MB.")
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: DigitalAssetModuleService = req.scope.resolve(
    DIGITAL_ASSET_MODULE
  )

  const title = String(req.query.title || "").trim()
  const fileName = String(req.query.file_name || "").trim()
  const mimeType = String(req.query.mime_type || "").trim()

  if (!title) {
    return res.status(400).json({
      message: "`title` is required.",
    })
  }

  if (!fileName) {
    return res.status(400).json({
      message: "`file_name` is required.",
    })
  }

  let fileBuffer: Buffer

  try {
    fileBuffer = await readRawBody(req)
  } catch (e) {
    return res.status(400).json({
      message:
        e instanceof Error ? e.message : "Failed to read uploaded file body.",
    })
  }

  if (!fileBuffer.length) {
    return res.status(400).json({
      message: "Uploaded file is empty.",
    })
  }

  try {
    const { publicUrl } = await uploadToSupabaseStorage({
      fileBuffer,
      fileName,
      mimeType,
    })

    const [asset] = await service.createDigitalAssets([
      {
        title,
        file_url: publicUrl,
        file_name: fileName,
        mime_type: mimeType || null,
        storage_provider: "supabase",
        is_active: true,
      },
    ])

    return res.status(201).json({
      digital_asset: asset,
    })
  } catch (e) {
    return res.status(500).json({
      message:
        e instanceof Error
          ? e.message
          : "Failed to upload file and create digital asset.",
    })
  }
}
