export type ChargeReadScope =
  | { kind: 'tenant'; tenantId: string }
  | { kind: 'renter'; userId: string }
  | { kind: 'propertyOwner'; tenantId: string; ownerId: string }
