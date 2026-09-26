const publicRouteDefinitions = [
  { path: '/login', label: 'Sign in' },
  { path: '/signup', label: 'Create account' },
  { path: '/verify-email', label: 'Verify email' },
  { path: '/forgot-password', label: 'Forgot password' },
  { path: '/reset-password', label: 'Reset password' },
  { path: '/logout', label: 'Sign out' },
] as const

const accountRouteDefinitions = [
  { path: '/account', label: 'Account' },
  { path: '/account/api-keys', label: 'API keys' },
  { path: '/account/billing', label: 'Billing' },
  { path: '/account/admin', label: 'Administration' },
] as const

const routeDefinitions = [...publicRouteDefinitions, ...accountRouteDefinitions]

export { accountRouteDefinitions, publicRouteDefinitions, routeDefinitions }
