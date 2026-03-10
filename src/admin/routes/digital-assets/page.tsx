import { defineRouteConfig } from "@medusajs/admin-sdk"
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
import { useSearchParams } from "react-router-dom"

type DigitalAsset = {
  id: string
  title: string
  file_url: string
  file_name?: string | null
  mime_type?: string | null
  is_active?: boolean
}

type Variant = {
  id: string
  title?: string | null
  sku?: string | null
}

type Product = {
  id: string
  title: string
  variants?: Variant[]
}

const DigitalAssetsPage = () => {
  const [searchParams] = useSearchParams()
  const initialProductId = searchParams.get("product_id") || ""

  const [assets, setAssets] = useState<DigitalAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)

  const [productId, setProductId] = useState(initialProductId)
  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)

  const [assetTitle, setAssetTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [creatingAsset, setCreatingAsset] = useState(false)

  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [attaching, setAttaching] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const variants = useMemo(() => product?.variants || [], [product])

  const clearAlerts = () => {
    setMessage(null)
    setError(null)
  }

  const loadAssets = async () => {
    setLoadingAssets(true)
    clearAlerts()
    try {
      const res = await fetch("/admin/digital-assets", {
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error("Failed to load digital assets.")
      }
      const data = await res.json()
      setAssets(data.digital_assets || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load digital assets.")
    } finally {
      setLoadingAssets(false)
    }
  }

  const loadProduct = async (id: string) => {
    if (!id) {
      setProduct(null)
      setSelectedVariantId("")
      return
    }

    setLoadingProduct(true)
    clearAlerts()
    try {
      const res = await fetch(
        `/admin/products/${id}?fields=id,title,variants.id,variants.title,variants.sku`,
        {
          credentials: "include",
        }
      )
      if (!res.ok) {
        throw new Error("Product not found or not accessible.")
      }
      const data = await res.json()
      setProduct(data.product || null)
      setSelectedVariantId((data.product?.variants || [])[0]?.id || "")
    } catch (e) {
      setProduct(null)
      setSelectedVariantId("")
      setError(e instanceof Error ? e.message : "Failed to load product.")
    } finally {
      setLoadingProduct(false)
    }
  }

  useEffect(() => {
    loadAssets()
    if (initialProductId) {
      loadProduct(initialProductId)
    }
  }, [])

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAlerts()

    if (!assetTitle.trim() || !selectedFile) {
      setError("Title and file are required.")
      return
    }

    setCreatingAsset(true)
    try {
      const query = new URLSearchParams({
        title: assetTitle.trim(),
        file_name: selectedFile.name,
        mime_type: selectedFile.type || "application/octet-stream",
      })

      const res = await fetch(`/admin/digital-assets/upload?${query.toString()}`, {
        method: "POST",
        headers: { "content-type": selectedFile.type || "application/octet-stream" },
        credentials: "include",
        body: selectedFile,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create digital asset.")
      }

      setMessage("Digital asset created.")
      setAssetTitle("")
      setSelectedFile(null)
      setSelectedAssetId(data.digital_asset?.id || "")
      await loadAssets()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create digital asset.")
    } finally {
      setCreatingAsset(false)
    }
  }

  const handleLoadProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAlerts()
    await loadProduct(productId.trim())
  }

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAlerts()

    if (!selectedAssetId || !selectedVariantId) {
      setError("Select a digital asset and a variant.")
      return
    }

    setAttaching(true)
    try {
      const res = await fetch(
        `/admin/digital-assets/${selectedAssetId}/variants`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            variant_id: selectedVariantId,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to attach asset to variant.")
      }

      setMessage("Asset attached to variant.")
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to attach asset to variant."
      )
    } finally {
      setAttaching(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4 p-6">
      <Heading level="h1">Digital Assets</Heading>
      <Text className="text-ui-fg-subtle">
        Create downloadable assets and attach them to product variants.
      </Text>

      {message && (
        <Container className="p-4 border border-ui-border-base">
          <Text>{message}</Text>
        </Container>
      )}

      {error && (
        <Container className="p-4 border border-rose-300 bg-rose-50">
          <Text>{error}</Text>
        </Container>
      )}

      <Container className="p-4">
        <Heading level="h2">1) Create Digital Asset</Heading>
        <form className="mt-4 flex flex-col gap-y-3" onSubmit={handleCreateAsset}>
          <div className="grid gap-y-2">
            <Label htmlFor="asset-title">Title</Label>
            <Input
              id="asset-title"
              value={assetTitle}
              onChange={(e) => setAssetTitle(e.target.value)}
              placeholder="Biology Question Bank PDF"
            />
          </div>
          <div className="grid gap-y-2">
            <Label htmlFor="asset-file">Upload File</Label>
            <Input
              id="asset-file"
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile && (
              <Text className="text-ui-fg-subtle">
                Selected: {selectedFile.name}
              </Text>
            )}
          </div>
          <div className="flex gap-x-2">
            <Button type="submit" isLoading={creatingAsset}>
              Create Asset
            </Button>
            <Button
              type="button"
              variant="secondary"
              isLoading={loadingAssets}
              onClick={() => loadAssets()}
            >
              Refresh Assets
            </Button>
          </div>
        </form>
      </Container>

      <Container className="p-4">
        <Heading level="h2">2) Select Product & Variant</Heading>
        <form className="mt-4 flex flex-col gap-y-3" onSubmit={handleLoadProduct}>
          <div className="grid gap-y-2">
            <Label htmlFor="product-id">Product ID</Label>
            <Input
              id="product-id"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="prod_..."
            />
          </div>
          <div className="flex gap-x-2">
            <Button type="submit" isLoading={loadingProduct}>
              Load Product Variants
            </Button>
          </div>
        </form>
        {product && (
          <div className="mt-4 flex flex-col gap-y-2">
            <Text>
              Product: <strong>{product.title}</strong>
            </Text>
            <div className="grid gap-y-2">
              <Label htmlFor="variant-select">Variant</Label>
              <Select
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
              >
                <Select.Trigger id="variant-select">
                  <Select.Value placeholder="Select variant" />
                </Select.Trigger>
                <Select.Content>
                  {variants.map((variant) => (
                    <Select.Item key={variant.id} value={variant.id}>
                      {variant.title || variant.id}
                      {variant.sku ? ` (${variant.sku})` : ""}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        )}
      </Container>

      <Container className="p-4">
        <Heading level="h2">3) Attach Asset to Variant</Heading>
        <form className="mt-4 flex flex-col gap-y-3" onSubmit={handleAttach}>
          <div className="grid gap-y-2">
            <Label htmlFor="asset-select">Digital Asset</Label>
            <Select
              value={selectedAssetId}
              onValueChange={setSelectedAssetId}
            >
              <Select.Trigger id="asset-select">
                <Select.Value
                  placeholder={loadingAssets ? "Loading..." : "Select asset"}
                />
              </Select.Trigger>
              <Select.Content>
                {assets.map((asset) => (
                  <Select.Item key={asset.id} value={asset.id}>
                    {asset.title}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex gap-x-2">
            <Button type="submit" isLoading={attaching}>
              Attach
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Digital Assets",
  nested: "/products",
})

export default DigitalAssetsPage
