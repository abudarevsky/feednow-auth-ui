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
  { path: '/account/security', label: 'Security' },
  { path: '/account/api-keys', label: 'API keys' },
] as const

const routeDefinitions = [...publicRouteDefinitions, ...accountRouteDefinitions]

export { accountRouteDefinitions, publicRouteDefinitions, routeDefinitions }
