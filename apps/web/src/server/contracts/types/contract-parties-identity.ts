export type ContractPartyIdentity = { cpf: string }

export type ContractPartiesIdentity = {
  owner: ContractPartyIdentity
  tenant: ContractPartyIdentity
  guarantor?: ContractPartyIdentity | null
}
