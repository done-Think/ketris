export interface ConfirmPublicEmailChangeInput {
  requestId: string
  code: string
}

export interface EmailCodeLinkContent {
  url: string
  label: string
  instructions: string
}
