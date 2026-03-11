import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type DigitalAsset = {
  id: string
  title: string
  file_url: string
  file_name?: string | null
}

type VariantWidgetData = {
  id?: string
  title?: string
  sku?: string | null
}

const VariantDigitalAssetsWidget = ({ data }: { data: VariantWidgetData }) => {
  const variantId = data?.id || ""

  const [allAssets, setAllAssets] = useState<DigitalAsset[]>([])
  const [attachedAssets, setAttachedAssets] = useState<DigitalAsset[]>([])
  const [loading, setLoading] = useState(false)

  const [assetTitle, setAssetTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [attaching, setAttaching] = useState(false)
  const [removingAssetId, setRemovingAssetId] = useState<string | null>(null)
  const [requiresShipping, setRequiresShipping] = useState<boolean>(true)
  const [hasInventoryItem, setHasInventoryItem] = useState<boolean>(false)
  const [savingShipping, setSavingShipping] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const attachedAssetIds = useMemo(
    () => new Set(attachedAssets.map((asset) => asset.id)),
    [attachedAssets]
  )
  const attachableAssets = useMemo(
    () => allAssets.filter((asset) => !attachedAssetIds.has(asset.id)),
    [allAssets, attachedAssetIds]
  )

  const clearAlerts = () => {
    setError(null)
    setMessage(null)
  }

  const loadData = async () => {
    if (!variantId) {
      return
    }

    setLoading(true)
    clearAlerts()

    try {
      const res = await fetch(`/admin/product-variants/${variantId}/digital-assets`, {
        credentials: "include",
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload.message || "Failed to load digital assets.")
      }

      setAllAssets(payload.all_assets || [])
      setAttachedAssets(payload.attached_assets || [])
      setHasInventoryItem(!!payload.inventory_item?.id)
      if (typeof payload.inventory_item?.requires_shipping === "boolean") {
        setRequiresShipping(payload.inventory_item.requires_shipping)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load digital assets.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [variantId])

  const attachAsset = async (assetId: string) => {
    const res = await fetch(`/admin/digital-assets/${assetId}/variants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        variant_id: variantId,
      }),
    })

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(payload.message || "Failed to attach digital asset.")
    }
  }

  const handleUploadAndAttach = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAlerts()

    if (!variantId) {
      setError("Variant ID not available.")
      return
    }

    if (!assetTitle.trim() || !selectedFile) {
      setError("Asset title and file are required.")
      return
    }

    setCreating(true)
    try {
      const query = new URLSearchParams({
        title: assetTitle.trim(),
        file_name: selectedFile.name,
        mime_type: selectedFile.type || "application/octet-stream",
      })

      const createRes = await fetch(
        `/admin/digital-assets/upload?${query.toString()}`,
        {
          method: "POST",
          headers: {
            "content-type": selectedFile.type || "application/octet-stream",
          },
          credentials: "include",
          body: selectedFile,
        }
      )

      const createPayload = await createRes.json().catch(() => ({}))

      if (!createRes.ok) {
        throw new Error(createPayload.message || "Failed to upload file.")
      }

      const assetId = createPayload?.digital_asset?.id

      if (!assetId) {
        throw new Error("Digital asset created but ID is missing.")
      }

      await attachAsset(assetId)

      setAssetTitle("")
      setSelectedFile(null)
      setSelectedAssetId("")
      setMessage("File uploaded and attached. Previous attachment was replaced.")
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload and attach.")
    } finally {
      setCreating(false)
    }
  }

  const handleAttachExisting = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAlerts()

    if (!variantId || !selectedAssetId) {
      setError("Select an asset to attach.")
      return
    }

    setAttaching(true)
    try {
      await attachAsset(selectedAssetId)
      setSelectedAssetId("")
      setMessage("Existing asset attached. Previous attachment was replaced.")
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to attach existing asset.")
    } finally {
      setAttaching(false)
    }
  }

  const handleRemoveAttached = async (assetId: string) => {
    clearAlerts()

    if (!variantId) {
      setError("Variant ID not available.")
      return
    }

    setRemovingAssetId(assetId)
    try {
      const res = await fetch(`/admin/digital-assets/${assetId}/variants`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          variant_id: variantId,
        }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload.message || "Failed to remove attachment.")
      }

      setMessage("Attachment removed from this variant.")
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove attachment.")
    } finally {
      setRemovingAssetId(null)
    }
  }

  const handleSaveShipping = async () => {
    clearAlerts()

    if (!variantId) {
      setError("Variant ID not available.")
      return
    }

    setSavingShipping(true)
    try {
      const res = await fetch(`/admin/product-variants/${variantId}/digital-assets`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          requires_shipping: requiresShipping,
        }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(payload.message || "Failed to update shipping setting.")
      }

      setMessage("Shipping requirement updated for this variant.")
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update shipping setting.")
    } finally {
      setSavingShipping(false)
    }
  }

  return (
    <Container className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h2">Digital Assets</Heading>
          <Text className="text-ui-fg-subtle">
            Upload and attach downloadable files directly to this variant.
          </Text>
          {data?.title && (
            <Text className="text-ui-fg-muted mt-1">
              Variant: {data.title}
              {data.sku ? ` (${data.sku})` : ""}
            </Text>
          )}
        </div>
        <Button type="button" variant="secondary" isLoading={loading} onClick={loadData}>
          Refresh
        </Button>
      </div>

      {message && (
        <Container className="mt-4 border border-ui-border-base p-3">
          <Text>{message}</Text>
        </Container>
      )}

      {error && (
        <Container className="mt-4 border border-rose-300 bg-rose-50 p-3">
          <Text>{error}</Text>
        </Container>
      )}

      <div className="mt-4 grid gap-3">
        <Heading level="h3">Shipping Requirement</Heading>
        <div className="flex items-center justify-between">
          <Label htmlFor="variant-requires-shipping">Requires shipping</Label>
          <input
            id="variant-requires-shipping"
            type="checkbox"
            checked={requiresShipping}
            disabled={!hasInventoryItem || savingShipping}
            onChange={(e) => setRequiresShipping(e.target.checked)}
          />
        </div>
        {!hasInventoryItem && (
          <Text className="text-ui-fg-subtle">
            This variant has no inventory item yet. Enable inventory tracking
            on the variant first, then this toggle will be editable.
          </Text>
        )}
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveShipping}
            isLoading={savingShipping}
            disabled={!hasInventoryItem}
          >
            Save Shipping Setting
          </Button>
        </div>
      </div>

      <form className="mt-4 grid gap-3" onSubmit={handleUploadAndAttach}>
        <Heading level="h3">Upload and Attach</Heading>
        <div className="grid gap-2">
          <Label htmlFor="variant-asset-title">Asset title</Label>
          <Input
            id="variant-asset-title"
            value={assetTitle}
            onChange={(e) => setAssetTitle(e.target.value)}
            placeholder="Biology Question Bank PDF"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="variant-asset-file">File</Label>
          <Input
            id="variant-asset-file"
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <Button type="submit" isLoading={creating}>
            Upload and Attach
          </Button>
        </div>
        <Text className="text-ui-fg-subtle">
          Only one file can be attached to a variant. Uploading/attaching a new
          file will replace the current one.
        </Text>
      </form>

      <form className="mt-6 grid gap-3" onSubmit={handleAttachExisting}>
        <Heading level="h3">Attach Existing Asset</Heading>
        <div className="grid gap-2">
          <Label htmlFor="variant-existing-asset">Digital asset</Label>
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <Select.Trigger id="variant-existing-asset">
              <Select.Value placeholder="Select existing asset" />
            </Select.Trigger>
            <Select.Content>
              {attachableAssets.map((asset) => (
                <Select.Item key={asset.id} value={asset.id}>
                  {asset.title}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div>
          <Button type="submit" variant="secondary" isLoading={attaching}>
            Attach Existing
          </Button>
        </div>
        <Text className="text-ui-fg-subtle">
          Attaching an existing asset replaces the currently attached file.
        </Text>
      </form>

      <div className="mt-6 grid gap-2">
        <Heading level="h3">Attached to This Variant</Heading>
        {!attachedAssets.length ? (
          <Text className="text-ui-fg-subtle">No digital assets attached yet.</Text>
        ) : (
          <div className="grid gap-2">
            {attachedAssets.map((asset) => (
              <Container key={asset.id} className="border border-ui-border-base p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Text>
                      <strong>{asset.title}</strong>
                    </Text>
                    {asset.file_name && (
                      <Text className="text-ui-fg-subtle">{asset.file_name}</Text>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="transparent"
                    isLoading={removingAssetId === asset.id}
                    onClick={() => handleRemoveAttached(asset.id)}
                  >
                    Remove
                  </Button>
                </div>
              </Container>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
})

export default VariantDigitalAssetsWidget
