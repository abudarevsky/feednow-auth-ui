function createApiProxy(target: string) {
  return {
    '/api': {
      target,
      changeOrigin: true,
    },
  }
}

export { createApiProxy }
