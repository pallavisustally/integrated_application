import type { CollectionConfig } from "payload";
import { getFnAppUrl } from "../lib/app-urls";
// import { afterChangeHook } from "./Scope2Hooks"; // Removed static import to prevent client-side issues

const Scope2Applications: CollectionConfig = {
  slug: "scope2-applications",
  admin: {
    useAsTitle: "facilityName",
    description:
      "Scope 2 submissions. Filter status = PENDING for review. Approve syncs parent assessment to APPROVED.",
    group: "Assessments",
    defaultColumns: [
      "facilityName",
      "email",
      "assessmentId",
      "status",
      "createdAt",
    ],
    listSearchableFields: ["email", "facilityName", "assessmentId"],
  },
  access: {
    create: () => true, // Allow anyone to create applications
    read: () => true, // Allow anyone to read applications
    update: () => true, // Creating open access for now to resolve 401 error
    delete: () => true, // Allow anyone to delete applications to resolve 403 error
  },
  hooks: {
    beforeChange: [
      // Generate certificateId on create: GHGCAL + reporting year + certificate count
      async ({ data, operation, req }) => {
        if (typeof window !== "undefined") return data;
        if (operation !== "create" || !data) return data;
        if (data.certificateId) return data;

        try {
          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dateKey = `${dd}${mm}`; // e.g. "0503"

          const result = await req.payload.find({
            collection: "scope2-applications",
            limit: 0,
          });
          const nextNumber = (result.totalDocs || 0) + 1;
          data.certificateId = `GHGCAL${dateKey}${String(nextNumber).padStart(5, "0")}`;
        } catch (err) {
          console.error("[Scope2] Failed to generate certificateId:", err);
          const fallbackToday = new Date();
          const fallbackDd = String(fallbackToday.getDate()).padStart(2, '0');
          const fallbackMm = String(fallbackToday.getMonth() + 1).padStart(2, '0');
          data.certificateId = `GHGCAL${fallbackDd}${fallbackMm}00001`;
        }
        return data;
      },
    ],
    afterChange: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ doc, previousDoc, operation, req }: any) => {
        // Only load and run the hook on the server
        if (typeof window === 'undefined' && operation === 'update') {
          try {
            const { sendApprovalEmail, sendRejectionEmail } = await import('../lib/email');

            const submission = {
              id: doc.id,
              status: doc.status,
              submittedAt: doc.createdAt,
              data: doc,
            };

            const userEmail = doc.email || doc.userEmail;

            if (doc.status === "APPROVED" && previousDoc.status !== "APPROVED") {
              console.log(`[Scope2] Approving submission ${doc.id}. Email: ${userEmail}`);
              if (doc.assessmentId) {
                const parent = await req.payload.find({
                  collection: 'assessments',
                  where: { assessmentId: { equals: doc.assessmentId } },
                  limit: 1,
                });
                if (parent.totalDocs > 0) {
                  await req.payload.update({
                    collection: 'assessments',
                    id: parent.docs[0].id,
                    data: { status: 'APPROVED', approvedAt: new Date().toISOString() },
                    req,
                  });
                }
              }
              if (userEmail) {
                await sendApprovalEmail(
                  userEmail,
                  submission,
                  doc.assessmentId as string | undefined,
                );
              } else {
                console.error(`[Scope2] Cannot send approval email. No email found for submission ${doc.id}`);
              }
            }

            if (doc.status === "REJECTED" && previousDoc.status !== "REJECTED") {
              const reason = doc.rejectionReason;
              console.log(`[Scope2] Rejecting submission ${doc.id}. Email: ${userEmail}, Reason: ${reason}`);

              if (doc.assessmentId) {
                const parent = await req.payload.find({
                  collection: 'assessments',
                  where: { assessmentId: { equals: doc.assessmentId } },
                  limit: 1,
                });
                if (parent.totalDocs > 0) {
                  await req.payload.update({
                    collection: 'assessments',
                    id: parent.docs[0].id,
                    data: { status: 'REJECTED', rejectionReason: reason || '' },
                    req,
                  });
                }
              }

              let newAssessmentLink = undefined;

              if (userEmail) {
                try {
                  // Find the latest slot booking for this user to get their details
                  const slotBookingResult = await req.payload.find({
                    collection: 'slot-bookings',
                    where: {
                      email: { equals: userEmail }
                    },
                    sort: '-createdAt',
                    limit: 1,
                  });

                  if (slotBookingResult.totalDocs > 0) {
                    const oldBooking = slotBookingResult.docs[0];
                    const newAssessmentId = Math.random().toString(36).substring(2, 10).toUpperCase();

                    // Construct new assessment link with same details
                    const baseUrl = getFnAppUrl();
                    const params = new URLSearchParams();
                    params.append('name', oldBooking.name || '');
                    params.append('email', oldBooking.email || '');
                    params.append('mobile', oldBooking.mobile || '');
                    params.append('company', oldBooking.company || '');
                    params.append('sector', oldBooking.sector || '');
                    params.append('natureOfBusiness', oldBooking.natureOfBusiness || '');
                    params.append('country', oldBooking.country || '');
                    params.append('assignmentDate', oldBooking.assignmentDate || '');
                    params.append('assignmentTime', oldBooking.assignmentTime || '');
                    params.append('assessmentId', newAssessmentId);
                    params.append('retry', 'true');

                    newAssessmentLink = `${baseUrl}/scope?${params.toString()}`;

                    // Create a NEW slot booking record for tracking the retry
                    await req.payload.create({
                      collection: 'slot-bookings',
                      data: {
                        name: oldBooking.name || '',
                        email: oldBooking.email || '',
                        mobile: oldBooking.mobile || '',
                        company: oldBooking.company || '',
                        sector: oldBooking.sector || '',
                        natureOfBusiness: oldBooking.natureOfBusiness || '',
                        country: oldBooking.country || '',
                        assignmentDate: oldBooking.assignmentDate || '',
                        assignmentSlot: oldBooking.assignmentSlot || '',
                        assignmentTime: oldBooking.assignmentTime || '',
                        assessmentId: newAssessmentId,
                        assessmentLink: newAssessmentLink,
                      }
                    });

                    console.log(`[Scope2] Generated new retry link for ${userEmail}: ${newAssessmentLink}`);
                  }
                } catch (err) {
                  console.error(`[Scope2] Failed to generate retry link:`, err);
                }

                await sendRejectionEmail(userEmail, submission, reason, newAssessmentLink);
              } else {
                console.error(`[Scope2] Cannot send rejection email. No email found for submission ${doc.id}`);
              }
            }
          } catch (error) {
            console.error('[Scope2Applications] Error in afterChange hook:', error);
          }
        }
        return doc;
      }
    ],
  },
  fields: [
    {
      name: "assessmentId",
      type: "text",
      index: true,
      admin: {
        description: "Public assessment reference from booking (assessments collection)",
      },
    },
    {
      name: "assessment",
      type: "relationship",
      relationTo: "assessments",
      admin: {
        description: "Parent unified assessment booking",
      },
    },
    {
      name: "userName",
      type: "text",
    },
    {
      name: "userMobile",
      type: "text",
    },
    {
      name: "userCompany",
      type: "text",
    },
    {
      name: "userEmail",
      type: "email",
    },
    {
      name: "email",
      type: "email",
      admin: {
        position: "sidebar",
      },
    },

    {
      name: "sector",
      type: "text",
    },
    {
      name: "natureOfBusiness",
      type: "text",
    },
    // Page 1 - Box 1
    {
      name: "state",
      type: "text",
      required: true,
    },
    {
      name: "utilityProvider",
      type: "text",
      required: false,
    },
    {
      name: "siteCount",
      type: "text",
      required: true,
    },
    {
      name: "siteCountNumber",
      type: "text",
    },
    {
      name: "facilityName",
      type: "text",
      required: true,
    },
    {
      name: "energyIntensityPerRupee",
      type: "text",
      required: false,
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
      ],
      defaultValue: "PENDING",
      required: true,
    },
    {
      name: "rejectionReason",
      type: "textarea",
      admin: {
        condition: (data, siblingData) => siblingData?.status === "REJECTED",
      },
    },
    {
      name: "certificateId",
      type: "text",
      admin: {
        description: "Format: GHGCAL + DDMM + certificate count (e.g. GHGCAL050300001)",
        readOnly: true,
      },
    },
    // Page 1 - Box 2
    {
      name: "renewableProcurement",
      type: "select",
      options: [
        { label: "Yes", value: "Yes" },
        { label: "No", value: "No" },
      ],
      required: true,
    },
    {
      name: "onsiteExportedKwh",
      type: "text",
      required: false,
    },
    {
      name: "netMeteringApplicable",
      type: "select",
      options: [
        { label: "Yes", value: "Yes" },
        { label: "No", value: "No" },
      ],
      required: true,
    },
    // Page 1 - Box 3
    {
      name: "reportingYear",
      type: "text",
      required: true,
    },
    {
      name: "reportingPeriod",
      type: "select",
      options: [
        { label: "Annually", value: "Annually" },
      ],
      required: true,
    },
    {
      name: "conditionalApproach",
      type: "select",
      options: [
        { label: "Operational Control", value: "Operational Control" },
        { label: "Equity Share", value: "Equity Share" },
        { label: "Financial Control", value: "Financial Control" },
      ],
      required: true,
    },
    // Page 1 - Box 4
    {
      name: "scopeBoundaryNotes",
      type: "textarea",
      required: false,
    },
    // Page 2 - Box 1 (Energy Activity)
    {
      name: "energyActivityInput",
      type: "select",
      options: [
        { label: "Monthly", value: "Monthly" },
        { label: "Yearly", value: "Yearly" },
      ],
      required: true,
    },
    {
      name: "energyCategory",
      type: "text",
      required: true,
    },
    {
      name: "trackingType",
      type: "select",
      options: [
        { label: "Unit consumption", value: "Unit consumption" },
        { label: "Spend amount", value: "Spend amount" },
        { label: "Both", value: "Both" },
      ],
      required: true,
    },
    {
      name: "spendAmount",
      type: "number",
      admin: {
        condition: (data, siblingData) =>
          siblingData?.trackingType === "Spend amount" ||
          siblingData?.trackingType === "Both",
      },
      required: false,
    },
    {
      name: "electricityPurchased",
      type: "number",
      admin: {
        condition: (data, siblingData) =>
          siblingData?.trackingType === "Unit consumption" ||
          siblingData?.trackingType === "Both",
      },
      required: false,
    },
    {
      name: "energyConsumption",
      type: "text",
    },
    {
      name: "dataSourceType",
      type: "text",
    },
    {
      name: "energySupportingEvidenceFile",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Supporting evidence uploaded by the user. View the image/file in the admin panel.",
      },
      displayPreview: true,
    },
    {
      name: "energySupportingEvidenceFileUrl",
      type: "text",
      admin: {
        description: "Direct URL link to the Vercel Blob evidence file.",
      }
    },
    {
      name: "energySupportingEvidenceFileName",
      type: "text",
    },
    {
      name: "energySourceDescription",
      type: "textarea",
      required: false,
    },
    // Page 2 - Box 2 (Renewable Electricity)
    {
      name: "hasRenewableElectricity",
      type: "select",
      options: [
        { label: "Yes", value: "Yes" },
        { label: "No", value: "No" },
      ],
      required: true,
    },
    {
      name: "renewableElectricity",
      type: "text",
    },
    {
      name: "renewableDataSourceType",
      type: "text",
    },
    {
      name: "renewableEnergyConsumption",
      type: "text",
    },
    {
      name: "renewableSupportingEvidenceFile",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Supporting evidence for renewable electricity. View the image/file in the admin panel.",
      },
      displayPreview: true,
    },
    {
      name: "renewableSupportingEvidenceFileUrl",
      type: "text",
      admin: {
        description: "Direct URL link to the Vercel Blob evidence file.",
      }
    },
    {
      name: "renewableSupportingEvidenceFileName",
      type: "text",
    },
    {
      name: "renewableEnergySourceDescription",
      type: "textarea",
      required: false,
    },
    // Calculated Fields
    {
      name: "gridEmissionFactor",
      type: "number",
    },
    {
      name: "locationBasedEmissions",
      type: "number",
    },
    {
      name: "marketBasedEmissions",
      type: "number",
    },
    {
      name: "energyGrid_kJ",
      type: "number",
    },
    {
      name: "energyRenew_kJ",
      type: "number",
    },
    {
      name: "energyTotal_kJ",
      type: "number",
    },
    {
      name: "renewableEnergyActivityInput",
      type: "select",
      options: [
        { label: "Monthly", value: "Monthly" },
        { label: "Yearly", value: "Yearly" },
      ],
      defaultValue: "Yearly",
    },
    {
      name: "monthlyData",
      type: "json",
    },
    {
      name: "renewableMonthlyData",
      type: "json",
    },
    {
      name: "otp",
      type: "text",
      hidden: true,
    },
    {
      name: "otpExpiresAt",
      type: "date",
      hidden: true,
    },
  ],
  endpoints: [
    {
      path: "/generate-otp",
      method: "post",
      handler: async (req) => {
        const body = req.json ? await req.json() : {};
        const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();

        if (!email) {
          return Response.json({ error: "Email is required" }, { status: 400 });
        }

        try {
          // Find application by email (case-insensitive)
          const result = await req.payload.find({
            collection: "scope2-applications",
            overrideAccess: true,
            showHiddenFields: true,
            where: {
              email: {
                equals: email,
              },
            },
          });

          if (result.totalDocs === 0) {
            return Response.json({ error: "Email not found" }, { status: 404 });
          }

          const application = result.docs[0];

          if (application.status !== "APPROVED") {
            return Response.json(
              { error: "Application pending or rejected. Please contact admin." },
              { status: 403 }
            );
          }

          // Generate 6-digit OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

          console.log(`Generated OTP for Scope 2 ${email}: ${otp}`);
          console.time("otp-process");

          // Run DB update first to ensure OTP is valid
          const start = Date.now();
          console.log(`[OTP] Starting DB update for ${email}`);

          await req.payload.update({
            collection: "scope2-applications",
            id: application.id,
            data: {
              otp,
              otpExpiresAt: otpExpiresAt.toISOString(),
            },
          });

          console.log(`[OTP] DB Update completed in ${Date.now() - start}ms`);

          try {
            await req.payload.sendEmail({
              to: email,
              subject: "Your Dashboard Login OTP",
              html: `<p>Your OTP for dashboard access is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
            });
            console.log(`[OTP] Email sent successfully to ${email} in ${Date.now() - start}ms`);
          } catch (err) {
            console.error(`[OTP] Email failed for ${email}:`, err);
          }

          console.timeEnd("otp-process");
          return Response.json({ success: true, message: "OTP sent to email" });
        } catch (error) {
          console.error("Error generating OTP:", error);
          return Response.json(
            { error: "Internal server error" },
            { status: 500 }
          );
        }
      },
    },
    {
      path: "/verify-otp",
      method: "post",
      handler: async (req) => {
        const body = req.json ? await req.json() : {};
        const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
        const otp = (typeof body.otp === "string" ? body.otp : String(body.otp || "")).trim();

        if (!email || !otp) {
          return Response.json(
            { error: "Email and OTP are required" },
            { status: 400 }
          );
        }

        try {
          const result = await req.payload.find({
            collection: "scope2-applications",
            overrideAccess: true,
            showHiddenFields: true,
            where: {
              email: {
                equals: email,
              },
            },
          });

          if (result.totalDocs === 0) {
            return Response.json({ error: "Email not found" }, { status: 404 });
          }

          const application = result.docs[0];
          const storedOtp = String(application.otp || "").trim();

          // Check if OTP matches and is not expired (normalize both to strings to avoid type mismatch)
          if (
            storedOtp !== otp ||
            !application.otpExpiresAt ||
            new Date(application.otpExpiresAt) < new Date()
          ) {
            return Response.json({ error: "Invalid or expired OTP" }, { status: 401 });
          }

          // Clear OTP after successful verification
          await req.payload.update({
            collection: "scope2-applications",
            id: application.id,
            data: {
              otp: null,
              otpExpiresAt: null,
            },
          });

          return Response.json({
            success: true,
            user: {
              facilityName: application.facilityName,
              userCompany: application.userCompany,
              email: application.email,
              id: application.id,
              certificateId: application.certificateId,
              sector: application.sector,
              natureOfBusiness: application.natureOfBusiness,
              // Return all other fields needed for certificate
              state: application.state,
              siteCount: application.siteCount,
              energyIntensityPerRupee: application.energyIntensityPerRupee,
              reportingYear: application.reportingYear,
              reportingPeriod: application.reportingPeriod,
              scopeBoundaryNotes: application.scopeBoundaryNotes,
              energyConsumption: application.energyConsumption,
              renewableElectricity: application.renewableElectricity,
              renewableEnergyConsumption: application.renewableEnergyConsumption,
              onsiteExportedKwh: application.onsiteExportedKwh,
              gridEmissionFactor: application.gridEmissionFactor,
              locationBasedEmissions: application.locationBasedEmissions,
              marketBasedEmissions: application.marketBasedEmissions,
              energyGrid_kJ: application.energyGrid_kJ,
              energyRenew_kJ: application.energyRenew_kJ,
              energyTotal_kJ: application.energyTotal_kJ,
              // Additional fields for monthly data
              monthlyData: application.monthlyData,
              renewableMonthlyData: application.renewableMonthlyData,
              renewableEnergyActivityInput: application.renewableEnergyActivityInput,
              dataSourceType: application.dataSourceType,
              renewableDataSourceType: application.renewableDataSourceType,
              // Added for Cost Saving Card
              electricityPurchased: application.electricityPurchased,
              spendAmount: application.spendAmount,
              trackingType: application.trackingType,
              energyActivityInput: application.energyActivityInput,
            },
          });
        } catch (error) {
          console.error("Error verifying OTP:", error);
          return Response.json(
            { error: "Internal server error" },
            { status: 500 }
          );
        }
      },
    },
  ],
};

export default Scope2Applications;
