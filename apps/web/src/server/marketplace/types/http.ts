export interface MarketplaceIdRouteContext {
  params: Promise<{ id: string }>
}

export interface MarketplaceMediaRouteContext {
  params: Promise<{ key: string[] }>
}
