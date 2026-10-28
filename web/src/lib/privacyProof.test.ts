import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { analyzeScript, sha256Hex } from './privacyProof'

describe('privacy proof', () => {
  it('hashes deterministically', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('the shipped tracker script passes every check', () => {
    const js = readFileSync(join(__dirname, '../../../tracker/script.js'), 'utf8')
    const r = analyzeScript(js)
    const failed = r.checks.filter((c) => !c.pass)
    expect(failed).toEqual([])
    expect(r.storageOptIn).toBe(true)
  })

  it('catches fingerprinting, cookies and fetch', () => {
    const bad = `document.cookie='a=b'; var c=document.createElement('canvas'); fetch('/x'); new AudioContext()`
    const ids = analyzeScript(bad).checks.filter((c) => !c.pass).map((c) => c.id)
    expect(ids).toEqual(expect.arrayContaining(['cookies', 'canvas', 'audio', 'xhr']))
  })

  it('ignores forbidden words inside comments', () => {
    const js = `// never touches document.cookie\n/* fetch( is not used */ var x=1`
    expect(analyzeScript(js).checks.every((c) => c.pass)).toBe(true)
  })

  it('flags ungated storage use', () => {
    expect(analyzeScript(`localStorage.setItem('a','b')`).checks.find((c) => c.id === 'storage')?.pass).toBe(false)
  })
})
