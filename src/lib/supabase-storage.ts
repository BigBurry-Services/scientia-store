const getRequiredEnv = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const sanitizeFileName = (name: string) => {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase()
}

export const uploadToSupabaseStorage = async ({
  fileBuffer,
  fileName,
  mimeType,
}: {
  fileBuffer: Buffer
  fileName: string
  mimeType?: string
}) => {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL")
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  const bucket = getRequiredEnv("SUPABASE_STORAGE_BUCKET")

  const safeName = sanitizeFileName(fileName || "file")
  const objectKey = `digital-assets/${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${objectKey}`

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "x-upsert": "false",
      "content-type": mimeType || "application/octet-stream",
    },
    body: new Uint8Array(fileBuffer),
  })

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text()
    throw new Error(
      `Supabase upload failed (${uploadRes.status}): ${errorText || "Unknown error"}`
    )
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectKey}`

  return {
    publicUrl,
    objectKey,
  }
}
