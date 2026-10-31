import type { components } from '@shared/types/generated/api'

export type OwnPublicProfileAddress = components['schemas']['OwnPublicProfileAddress']
export type PublicProfileKind = OwnPublicProfileAddress['kind']
export type PublicProfileAddressAvailability =
  components['schemas']['PublicProfileAddressAvailability']
export type ProfileAddressPanelProps = { kind: PublicProfileKind }
export type ProfileAddressDialogProps = ProfileAddressPanelProps & {
  handle: string | null
  onClose: () => void
}
