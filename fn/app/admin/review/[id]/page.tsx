import ReviewClient from './ReviewClient'
import Scope1ReviewClient from './Scope1ReviewClient'

const SUSTALLY_API_URL =
  process.env.NEXT_PUBLIC_SUSTALLY_API_URL ||
  process.env.SUSTALLY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001'

async function getScope2Submission(id: string) {
  try {
    const res = await fetch(`${SUSTALLY_API_URL}/api/scope2-applications/${id}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Error fetching Scope 2 submission:', error)
    return null
  }
}

async function getScope1Application(id: string) {
  try {
    const res = await fetch(`${SUSTALLY_API_URL}/api/scope1-applications/${id}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) return await res.json()

    const query = new URLSearchParams({
      'where[scope1Assessment][equals]': id,
      limit: '1',
    })
    const linked = await fetch(
      `${SUSTALLY_API_URL}/api/scope1-applications?${query.toString()}`,
      { cache: 'no-store' },
    )
    if (linked.ok) {
      const json = await linked.json()
      if (json?.docs?.[0]) return json.docs[0]
    }
    return null
  } catch (error) {
    console.error('Error fetching Scope 1 application:', error)
    return null
  }
}

async function getScope1Assessment(id: string) {
  try {
    const res = await fetch(`${SUSTALLY_API_URL}/api/scope1-assessments/${id}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('Error fetching Scope 1 assessment:', error)
    return null
  }
}

export default async function AdminReviewPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const reviewType = searchParams?.type === 'scope1' ? 'scope1' : 'scope2'

  if (!params?.id) {
    return <div className="p-8 text-center text-red-500">Invalid submission ID</div>
  }

  if (reviewType === 'scope1') {
    let application = await getScope1Application(params.id)
    if (!application) {
      const assessment = await getScope1Assessment(params.id)
      if (assessment) {
        const linked = await getScope1Application(String(assessment.id))
        if (linked) {
          application = {
            ...linked,
            applicationId: linked.id,
            name: linked.inventoryName || linked.facilityName,
            reviewStatus:
              linked.status === 'APPROVED'
                ? 'approved'
                : linked.status === 'REJECTED'
                  ? 'rejected'
                  : 'pending',
          }
        } else {
        application = {
          ...assessment,
          applicationId: undefined,
          facilityName:
            (assessment.inputPayload as { facility?: { name?: string } })?.facility?.name ||
            assessment.name,
          inventoryName: assessment.name,
          status:
            assessment.reviewStatus === 'approved'
              ? 'APPROVED'
              : assessment.reviewStatus === 'rejected'
                ? 'REJECTED'
                : assessment.reviewStatus === 'pending'
                  ? 'PENDING'
                  : 'PENDING',
        }
        }
      }
    } else {
      application = {
        ...application,
        applicationId: application.id,
        name: application.inventoryName || application.facilityName,
        reviewStatus:
          application.status === 'APPROVED'
            ? 'approved'
            : application.status === 'REJECTED'
              ? 'rejected'
              : 'pending',
      }
    }

    if (!application) {
      return (
        <div className="flex h-screen items-center justify-center flex-col bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scope 1 submission not found</h1>
        </div>
      )
    }
    return <Scope1ReviewClient submission={application} />
  }

  const submissionData = await getScope2Submission(params.id)
  if (!submissionData) {
    return (
      <div className="flex h-screen items-center justify-center flex-col bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h1>
        <p className="text-gray-500">The requested assessment ID does not exist.</p>
      </div>
    )
  }

  const submission = {
    id: submissionData.id,
    status: submissionData.status || 'PENDING',
    submittedAt: submissionData.createdAt,
    data: submissionData,
  }

  return <ReviewClient submission={submission} />
}
