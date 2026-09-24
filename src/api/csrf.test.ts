import { describe, expect, it } from 'vitest'

import { readCookie } from '@/api/csrf'

describe('readCookie', () => {
  it('matches exact cookie names and decodes the value', () => {
    expect(readCookie('csrf-old=wrong; csrf=opaque%20value%3D1; other=x', 'csrf'))
      .toBe('opaque value=1')
  })

  it.each([
    ['', 'csrf'],
    ['csrf=', 'csrf'],
    ['csrf=%E0%A4%A', 'csrf'],
    ['csrf=unsafe%0D%0Avalue', 'csrf'],
    ['csrf-extra=value', 'csrf'],
  ])('rejects unusable cookie input', (cookieHeader, cookieName) => {
    expect(readCookie(cookieHeader, cookieName)).toBeUndefined()
  })
})
