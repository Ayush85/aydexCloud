import { describe, it, expect } from 'vitest'
import { safeEqual, validCronAuth, clientIp, cleanStr, cleanDomain, EMAIL_RE } from './security'

describe('security helpers', () => {
  it('safeEqual / validCronAuth', () => {
    expect(safeEqual('a', 'a')).toBe(true)
    expect(safeEqual('a', 'ab')).toBe(false)
    expect(validCronAuth('Bearer s3', 's3')).toBe(true)
    expect(validCronAuth('Bearer x', 's3')).toBe(false)
    expect(validCronAuth(null, 's3')).toBe(false)
    expect(validCronAuth('Bearer ', '')).toBe(false)      // unset secret fails closed
    expect(validCronAuth('Bearer undefined', undefined)).toBe(false)
  })
  it('clientIp reads Headers-like and plain objects', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4')
    expect(clientIp({ 'x-real-ip': '5.6.7.8' })).toBe('5.6.7.8')
    expect(clientIp({})).toBe('unknown')
  })
  it('cleanStr', () => {
    expect(cleanStr('  hi ', 1, 5)).toBe('hi')
    expect(cleanStr('', 1, 5)).toBeNull()
    expect(cleanStr('abcdef', 1, 5)).toBeNull()
    expect(cleanStr(5, 1, 5)).toBeNull()
    expect(cleanStr({}, 1, 5)).toBeNull()
  })
  it('cleanDomain', () => {
    expect(cleanDomain('https://www.Example.com/a?b')).toBe('www.example.com')
    expect(cleanDomain('example.com:8080')).toBe('example.com')
    for (const bad of ['', 'localhost', 'a b.com', '<script>.com', 5, null, 'x'.repeat(300) + '.com']) expect(cleanDomain(bad)).toBeNull()
  })
  it('EMAIL_RE', () => {
    expect(EMAIL_RE.test('a@b.co')).toBe(true)
    expect(EMAIL_RE.test('a@b')).toBe(false)
    expect(EMAIL_RE.test('a b@c.com')).toBe(false)
  })
})
