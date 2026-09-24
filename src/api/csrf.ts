type CsrfOptions = {
  cookieName: string
  headerName: string
  cookieReader?: () => string
}

function readCookie(cookieHeader: string, cookieName: string): string | undefined {
  if (!cookieName) return undefined

  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=')
    if (separator < 0 || entry.slice(0, separator).trim() !== cookieName) continue

    const encodedValue = entry.slice(separator + 1).trim()
    if (!encodedValue) return undefined

    try {
      const value = decodeURIComponent(encodedValue)
      const containsControl = [...value].some((character) => {
        const code = character.codePointAt(0) ?? 0
        return code <= 31 || code === 127
      })
      return value.length > 0 && !containsControl ? value : undefined
    } catch {
      return undefined
    }
  }

  return undefined
}

function isUnsafeMethod(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD'
}

function readCsrfToken(options: CsrfOptions): string | undefined {
  try {
    const cookieHeader = options.cookieReader?.() ?? (typeof document === 'undefined' ? '' : document.cookie)
    return readCookie(cookieHeader, options.cookieName)
  } catch {
    return undefined
  }
}

export { isUnsafeMethod, readCookie, readCsrfToken }
export type { CsrfOptions }
