import ReviewClient from "./ReviewClient";

const SUSTALLY_API_URL = process.env.SUSTALLY_API_URL || "https://render-beryl.vercel.app";

async function getSubmissionFromSustally(id: string) {
    try {
        // We need to fetch from the Payload API directly
        const res = await fetch(`${SUSTALLY_API_URL}/api/scope2-applications/${id}`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Error fetching submission:", error);
        return null;
    }
}

export default async function AdminReviewPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    if (!params?.id) {
        return <div className="p-8 text-center text-red-500">Invalid Submission ID</div>;
    }

    const submissionData = await getSubmissionFromSustally(params.id);

    if (!submissionData) {
        return (
            <div className="flex h-screen items-center justify-center flex-col bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h1>
                <p className="text-gray-500">The requested assessment ID does not exist.</p>
            </div>
        );
    }

    // Adapt Payload response to expected format if necessary
    // Payload returns `id`, `createdAt`, `updatedAt`, and fields.
    // The ReviewClient expects `Scope2Submission`.
    // We need to map it.

    const submission = {
        id: submissionData.id,
        status: submissionData.status || 'PENDING',
        submittedAt: submissionData.createdAt,
        data: submissionData // In Payload, fields are at root or in data? API returns fields at root.
    };

    return <ReviewClient submission={submission} />;
}
