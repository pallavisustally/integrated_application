import type { CollectionConfig } from "payload";

const Applications: CollectionConfig = {
  slug: "applications",
  admin: {
    useAsTitle: "name",
  },
  access: {
    create: () => true, // Allow anyone to create applications
    read: () => true, // Allow anyone to read applications (optional, adjust as needed)
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === "update" && doc.status === "APPROVED" && previousDoc.status !== "APPROVED") {
          try {
            const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?email=${encodeURIComponent(doc.email)}`;

            await req.payload.sendEmail({
              to: doc.email,
              subject: "Application Approved - Access Dashboard",
              html: `
                <p>Congratulations, your application has been approved!</p>
                <p>You can now access your dashboard using the link below:</p>
                <p><a href="${dashboardLink}">${dashboardLink}</a></p>
                <p>Clicking this link will send an OTP to your email for verification.</p>
              `,
            });
            console.log(`Sent approval email to ${doc.email}`);
          } catch (error) {
            console.error("Error sending approval email:", error);
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "mobile",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true, // Ensure email is unique for login
      index: true,
    },
    {
      name: "company",
      type: "text",
      required: true,
    },
    {
      name: "sector",
      type: "text",
      required: true,
    },
    {
      name: "natureOfBusiness",
      type: "textarea",
      required: true,
    },
    {
      name: "country",
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
            collection: "applications",
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

          console.log(`Generated OTP for ${email}: ${otp}`);

          // Save OTP to application
          await req.payload.update({
            collection: "applications",
            id: application.id,
            data: {
              otp,
              otpExpiresAt: otpExpiresAt.toISOString(),
            },
          });

          try {
            await req.payload.sendEmail({
              to: email,
              subject: "Your Dashboard Login OTP",
              html: `<p>Your OTP for dashboard access is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`,
            });
            console.log(`[OTP] Email sent successfully to ${email}`);
          } catch (err) {
            console.error(`[OTP] Email failed for ${email}:`, err);
          }

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
            collection: "applications",
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

          // Clear OTP after successful verification (optional, or keep it valid for short duration?)
          // Better to clear it to prevent replay
          await req.payload.update({
            collection: "applications",
            id: application.id,
            data: {
              otp: null,
              otpExpiresAt: null,
            },
          });

          return Response.json({
            success: true,
            user: {
              name: application.name,
              email: application.email,
              company: application.company,
              id: application.id,
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

export default Applications;
