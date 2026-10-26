export interface ContractRouteContext {
  params: Promise<{ id: string }>
}

export interface ContractPartyRouteContext {
  params: Promise<{ id: string; partyId: string }>
}

export interface ContractDocumentRouteContext {
  params: Promise<{ id: string; documentId: string }>
}
