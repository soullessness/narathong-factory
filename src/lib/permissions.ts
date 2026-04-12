export const ROLE_PERMISSIONS = {
  dashboard: ['admin', 'executive', 'factory_manager'],
  projects: ['admin', 'executive', 'factory_manager'],
  customers: ['admin', 'executive', 'factory_manager'],
  quotations: ['admin', 'executive', 'factory_manager'],
  products: ['admin', 'executive', 'factory_manager'],
  priceRequests: ['admin', 'executive', 'factory_manager', 'accounting'],
  workerLogs: ['admin', 'executive', 'factory_manager', 'team_lead', 'worker', 'sales', 'accounting'],
  productionOrders: ['admin', 'executive', 'factory_manager', 'team_lead', 'worker'],
  settings: ['admin'],
  settingsUsers: ['admin'],
  settingsTeams: ['admin', 'factory_manager'],
}

export function canAccess(role: string, feature: keyof typeof ROLE_PERMISSIONS): boolean {
  return ROLE_PERMISSIONS[feature].includes(role)
}
