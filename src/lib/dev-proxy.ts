function createApiProxy(target: string) {
  return {
    '/api': {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.startsWith('/api/') ? path.slice('/api'.length) : path,
    },
  }
}

export { createApiProxy }
