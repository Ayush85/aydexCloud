import { describe, it, expect } from 'vitest'
import { classifyChannel, CHANNEL_SQL } from './channels'

describe('classifyChannel', () => {
  it.each([
    ['', '/', 'Direct'],
    ['www.google.com', '/', 'Search'],
    ['google.co.uk', '/', 'Search'],
    ['duckduckgo.com', '/', 'Search'],
    ['gemini.google.com', '/', 'AI assistants'],
    ['chatgpt.com', '/x', 'AI assistants'],
    ['', '/x?utm_source=chatgpt.com', 'AI assistants'],
    ['perplexity.ai', '/', 'AI assistants'],
    ['t.co', '/', 'Social'],
    ['m.facebook.com', '/', 'Social'],
    ['box.com', '/', 'Referral'],
    ['example.org', '/', 'Referral'],
    ['', '/?utm_medium=cpc&utm_source=google', 'Paid'],
    ['', '/?utm_medium=email', 'Email'],
    ['mail.google.com', '/', 'Email'],
    ['news.ycombinator.com', '/', 'Social'],
  ])('%s %s -> %s', (ref, url, want) => {
    expect(classifyChannel(ref, url)).toBe(want)
  })
})

describe('CHANNEL_SQL', () => {
  it('is a single balanced multiIf expression', () => {
    expect(CHANNEL_SQL.startsWith('multiIf(')).toBe(true)
    expect(CHANNEL_SQL.split('(').length).toBe(CHANNEL_SQL.split(')').length)
  })
})
