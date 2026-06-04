import { redirect } from 'next/navigation'

/**
 * Legacy / mistaken admin links (e.g. localhost:3000/admin_dashboard/assessment/…)
 * redirect to the fn admin review UI.
 */
export default async function AssessmentIdRedirect(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scope?: string; type?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params?.id
  if (!id) {
    redirect('/admin_dashboard')
  }

  const isScope1 =
    searchParams?.scope === '1' || searchParams?.type === 'scope1'
  const type = isScope1 ? 'scope1' : 'scope2'

  redirect(`/admin/review/${id}?type=${type}`)
}
