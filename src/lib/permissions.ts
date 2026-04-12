export const ROLE_PERMISSIONS = {
  dashboard: ['admin', 'executive', 'factory_manager', 'sales'],
  projects: ['admin', 'executive', 'factory_manager', 'sales'],
  customers: ['admin', 'executive', 'factory_manager', 'sales'],
  quotations: ['admin', 'executive', 'factory_manager', 'sales'],
  products: ['admin', 'executive', 'factory_manager', 'sales'],
  priceRequests: ['admin', 'executive', 'factory_manager', 'accounting', 'sales'],
  workerLogs: ['admin', 'executive', 'factory_manager', 'team_lead', 'worker', 'accounting'],
  productionOrders: ['admin', 'executive', 'factory_manager', 'team_lead', 'worker'],
  settings: ['admin'],
  settingsUsers: ['admin'],
  settingsTeams: ['admin', 'factory_manager'],
}

export function canAccess(role: string, feature: keyof typeof ROLE_PERMISSIONS): boolean {
  return ROLE_PERMISSIONS[feature].includes(role)
}
