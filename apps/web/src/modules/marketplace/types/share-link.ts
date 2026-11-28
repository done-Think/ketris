export type ShareLinkInput = {
  title: string
  url: string
}

export type ShareLinkResult = 'shared' | 'copied' | 'cancelled' | 'failed'
