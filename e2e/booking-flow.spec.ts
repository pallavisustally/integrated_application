import { test, expect } from '@playwright/test'

import { SUSTALLY_URL, FN_URL, skipDbTests, uniqueEmail } from './helpers'

test.describe('Assessment booking + start', () => {
  test.skip(skipDbTests, 'Set E2E_SKIP_DB=1 to skip MongoDB-dependent tests')

  test('book Scope 1, validate, open assessment start', async ({ request, page }) => {
    const email = uniqueEmail('scope1')
    const bookRes = await request.post(`${SUSTALLY_URL}/api/assessments/book`, {
      data: {
        assessmentType: 'SCOPE_1',
        name: 'E2E User',
        email,
        company: 'E2E Cement Co',
        sector: 'Cement',
        assignmentDate: '2026-06-01',
        assignmentTime: '10:00',
      },
      headers: {
        'Content-Type': 'application/json',
        Origin: FN_URL,
      },
    })
    expect(bookRes.ok()).toBeTruthy()
    const booked = await bookRes.json()
    expect(booked.success).toBe(true)
    const assessmentId = booked.assessment.assessmentId as string
    expect(assessmentId.length).toBeGreaterThan(4)

    const validateRes = await request.get(
      `${SUSTALLY_URL}/api/assessments/validate?assessmentId=${encodeURIComponent(assessmentId)}&email=${encodeURIComponent(email)}`,
    )
    expect(validateRes.ok()).toBeTruthy()
    const validated = await validateRes.json()
    expect(validated.success).toBe(true)
    expect(validated.assessment.assessmentType).toBe('SCOPE_1')

    await page.goto(
      `/assessment/start?assessmentId=${encodeURIComponent(assessmentId)}&email=${encodeURIComponent(email)}`,
    )
    await page.waitForURL(/\/scope1/, { timeout: 30_000 })
    await expect(page.locator('body')).toContainText(/Scope|calculator|Cement|sector/i)
  })

  test('book Scope 2 and validate', async ({ request }) => {
    const email = uniqueEmail('scope2')
    const bookRes = await request.post(`${SUSTALLY_URL}/api/assessments/book`, {
      data: {
        assessmentType: 'SCOPE_2',
        name: 'E2E Scope2',
        email,
        company: 'E2E Utility Co',
        sector: 'Power',
      },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(bookRes.ok()).toBeTruthy()
    const { assessment } = await bookRes.json()
    const validateRes = await request.get(
      `${SUSTALLY_URL}/api/assessments/validate?assessmentId=${assessment.assessmentId}&email=${encodeURIComponent(email)}`,
    )
    const validated = await validateRes.json()
    expect(validated.assessment.assessmentType).toBe('SCOPE_2')
  })
})
