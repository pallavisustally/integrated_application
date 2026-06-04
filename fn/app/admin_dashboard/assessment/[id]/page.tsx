import { redirect } from 'next/navigation'

/** Redirect old admin_dashboard-style paths on the fn app to /admin/review. */
export default async function LegacyAdminDashboardAssessmentRedirect(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scope?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params?.id
  if (!id) redirect('/admin_dashboard')

  const type = searchParams?.scope === '1' ? 'scope1' : 'scope2'
  redirect(`/admin/review/${id}?type=${type}`)
}
