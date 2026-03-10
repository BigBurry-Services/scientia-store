import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"

type ProductWidgetData = {
  id?: string
  title?: string
}

const ProductDigitalAssetsLink = ({ data }: { data: ProductWidgetData }) => {
  const productId = data?.id

  const openManager = () => {
    if (!productId) {
      return
    }

    window.location.assign(`/app/digital-assets?product_id=${productId}`)
  }

  return (
    <Container className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Heading level="h2">Digital Assets</Heading>
          <Text className="text-ui-fg-subtle">
            Attach downloadable files to this product&apos;s variants.
          </Text>
        </div>
        <Button type="button" onClick={openManager} disabled={!productId}>
          Manage Digital Assets
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductDigitalAssetsLink
