export interface UserRouteContext {
  params: Promise<{ id: string }>
}

export interface AvatarMediaRouteContext {
  params: Promise<{ key: string[] }>
}
