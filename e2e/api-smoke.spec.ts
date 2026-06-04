import { readFileSync } from 'fs'
import path from 'path'
import { test, expect } from '@playwright/test'

import { SUSTALLY_URL } from './helpers'

const cementSamplePath = path.join(
  __dirname,
  '../sustally/samples/bharat-cement-FY2026.json',
)

test.describe('Sustally API smoke', () => {
  test('GET factors returns cement constants', async ({ request }) => {
    const res = await request.get(`${SUSTALLY_URL}/api/v1/factors?sector=cement`)
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect((json.constants?.length ?? 0) + (json.gases?.length ?? 0)).toBeGreaterThan(0)
  })

  test('POST cement calculate returns result', async ({ request }) => {
    const payload = JSON.parse(readFileSync(cementSamplePath, 'utf-8'))
    const res = await request.post(`${SUSTALLY_URL}/api/v1/calculations/cement/calculate`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.result?.scope1?.grossScope1CO2Tonnes).toBeDefined()
  })

  test('CORS preflight from fn origin on assessments book', async ({ request }) => {
    const res = await request.fetch(`${SUSTALLY_URL}/api/assessments/book`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    })
    expect(res.status()).toBe(200)
    const allowOrigin = res.headers()['access-control-allow-origin']
    expect(allowOrigin).toBe('http://localhost:3000')
  })

  test('CORS preflight on cement calculate', async ({ request }) => {
    const res = await request.fetch(`${SUSTALLY_URL}/api/v1/calculations/cement/calculate`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://127.0.0.1:3000',
        'Access-Control-Request-Method': 'POST',
      },
    })
    expect(res.status()).toBe(200)
    expect(res.headers()['access-control-allow-origin']).toBeTruthy()
  })
})
