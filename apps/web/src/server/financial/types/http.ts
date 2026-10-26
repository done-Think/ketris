export interface ChargeRouteContext {
  params: Promise<{ id: string }>
}

export interface ChargeReceiptRouteContext {
  params: Promise<{ id: string; receiptId: string }>
}
