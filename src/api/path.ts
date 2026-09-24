type ApiPath = `/api/${string}`

function asApiPath(path: string): ApiPath {
  if (!path.startsWith('/api/') || path.startsWith('//') || path.includes('\\')) {
    throw new TypeError('API requests require a same-origin /api/ path')
  }

  const parsed = new URL(path, 'https://account.feednow.io')
  if (parsed.origin !== 'https://account.feednow.io') {
    throw new TypeError('API requests require a same-origin /api/ path')
  }

  return path as ApiPath
}

export { asApiPath }
export type { ApiPath }
