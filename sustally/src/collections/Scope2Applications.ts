import type { CollectionConfig } from "payload";
// import { afterChangeHook } from "./Scope2Hooks"; // Removed static import to prevent client-side issues

const Scope2Applications: CollectionConfig = {
  slug: "scope2-applications",
  admin: {
    useAsTitle: "facilityName",
  },
  access: {
    create: () => true, // Allow anyone to create applications
    read: () => true, // Allow anyone to read applications
    update: () => true, // Creating open access for now to resolve 401 error
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ doc, previousDoc, operation }: any) => {
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
              if (userEmail) {
                await sendApprovalEmail(userEmail, submission);
              } else {
                console.error(`[Scope2] Cannot send approval email. No email found for submission ${doc.id}`);
              }
            }

            if (doc.status === "REJECTED" && previousDoc.status !== "REJECTED") {
              const reason = doc.rejectionReason;
              console.log(`[Scope2] Rejecting submission ${doc.id}. Email: ${userEmail}, Reason: ${reason}`);
              if (userEmail) {
                await sendRejectionEmail(userEmail, submission, reason);
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
      name: "email",
      type: "email",
      admin: {
        position: "sidebar",
      },
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
      name: "facilityName",
      type: "text",
      required: true,
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "PENDING" },
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
        { label: "Monthly", value: "Monthly" },
        { label: "Quarterly", value: "Quarterly" },
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
      name: "energySupportingEvidenceFile",
      type: "upload",
      relationTo: "media",
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
      name: "renewableEnergyConsumption",
      type: "text",
    },
    {
      name: "renewableSupportingEvidenceFile",
      type: "upload",
      relationTo: "media",
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
        const { email } = req.json ? await req.json() : { email: "" };

        if (!email) {
          return Response.json({ error: "Email is required" }, { status: 400 });
        }

        try {
          // Find application by email
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

          // Return response immediately - don't wait for email
          console.timeEnd("otp-process");
          
          // Send email asynchronously in the next event loop tick to ensure non-blocking
          setImmediate(() => {
            req.payload.sendEmail({
              to: email,
              subject: "Your Dashboard Login OTP",
              html: `<p>Your OTP for dashboard access is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
            })
              .then(() => console.log(`[OTP] Email sent successfully to ${email} in ${Date.now() - start}ms`))
              .catch(err => console.error(`[OTP] Background email failed for ${email}:`, err));
          });

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
        const { email, otp } = req.json ? await req.json() : { email: "", otp: "" };

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

          // Check if OTP matches and is not expired
          if (
            application.otp !== otp ||
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
              email: application.email,
              id: application.id,
              // Return all other fields needed for certificate
              state: application.state,
              siteCount: application.siteCount,
              reportingYear: application.reportingYear,
              reportingPeriod: application.reportingPeriod,
              scopeBoundaryNotes: application.scopeBoundaryNotes,
              renewableElectricity: application.renewableElectricity,
              renewableEnergyConsumption: application.renewableEnergyConsumption,
              onsiteExportedKwh: application.onsiteExportedKwh,
              gridEmissionFactor: application.gridEmissionFactor,
              locationBasedEmissions: application.locationBasedEmissions,
              marketBasedEmissions: application.marketBasedEmissions,
              energyGrid_kJ: application.energyGrid_kJ,
              energyRenew_kJ: application.energyRenew_kJ,
              energyTotal_kJ: application.energyTotal_kJ,
              // Added for Cost Saving Card
              electricityPurchased: application.electricityPurchased,
              spendAmount: application.spendAmount,
              trackingType: application.trackingType,
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
