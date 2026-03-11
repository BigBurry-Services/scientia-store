import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

type ProductWidgetData = {
  id?: string
  title?: string
}

const ProductDigitalAssetsLink = ({ data }: { data: ProductWidgetData }) => {
  return (
    <Container className="p-4">
      <Heading level="h2">Digital Assets</Heading>
      <Text className="text-ui-fg-subtle">
        Manage files directly in each variant page. Open a variant from this
        product to upload and attach downloadable assets.
      </Text>
      {data?.title && (
        <Text className="text-ui-fg-muted mt-1">Product: {data.title}</Text>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductDigitalAssetsLink
