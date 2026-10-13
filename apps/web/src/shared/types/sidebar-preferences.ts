export interface SidebarPreferencesState {
  isCollapsed: boolean
  setCollapsed: (isCollapsed: boolean) => void
  toggleCollapsed: () => void
}
