import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type PurchasedLineItem = {
  order_id: string
  payment_status: string | null
  line_item_id: string
  line_item_title: string | null
  variant_id: string | null
}

type OrderTransaction = {
  reference?: string | null
}

type OrderWithItems = {
  id: string
  payment_status?: string | null
  items?: Array<{
    id: string
    title?: string | null
    variant_id?: string | null
  }>
  transactions?: OrderTransaction[]
}

const PAID_STATUSES = new Set([
  "captured",
  "partially_captured",
  "authorized",
  "partially_authorized",
])

export const isOrderPaid = (status?: string | null) => {
  if (!status) {
    return false
  }

  return PAID_STATUSES.has(status)
}

const isPaidByTransaction = (transactions?: OrderTransaction[]) => {
  if (!transactions?.length) {
    return false
  }

  return transactions.some((txn) =>
    ["capture", "authorize"].includes((txn.reference || "").toLowerCase())
  )
}

export const getPurchasedLineItems = async (
  scope: { resolve: (key: string) => any },
  customerId: string
): Promise<PurchasedLineItem[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "payment_status",
      "transactions.reference",
      "items.id",
      "items.title",
      "items.variant_id",
    ],
    filters: {
      customer_id: customerId,
    },
  })

  const lineItems: PurchasedLineItem[] = []

  for (const order of (orders || []) as OrderWithItems[]) {
    const orderIsPaid =
      isOrderPaid(order.payment_status) || isPaidByTransaction(order.transactions)

    if (!orderIsPaid) {
      continue
    }

    for (const item of order.items || []) {
      lineItems.push({
        order_id: order.id,
        payment_status: order.payment_status ?? null,
        line_item_id: item.id,
        line_item_title: item.title ?? null,
        variant_id: item.variant_id ?? null,
      })
    }
  }

  return lineItems
}
