import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Auto-Vyn ERP",
  description:
    "Privacy Policy for Auto-Vyn ERP, including information about how we collect, use, store, and protect personal information.",
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
        {title}
      </h2>

      <div className="space-y-3 text-sm leading-7 text-aaa dark:text-body-color md:text-base">
        {children}
      </div>
    </section>
  );
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-off px-4 py-10 dark:bg-black md:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-header px-6 py-8 text-white shadow-one md:px-10 md:py-10">
          <p className="mb-2 text-sm font-medium text-front">
            Auto-Vyn ERP
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            Privacy Policy
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
            This Privacy Policy explains how Auto-Vyn ERP collects, uses,
            stores, and protects information when you use our services or
            submit information through forms connected with our services.
          </p>

          <p className="mt-4 text-xs text-white/70">
            Last updated: August 14, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-9 rounded-2xl bg-white p-6 shadow-one dark:bg-dark md:p-10">
          <Section title="1. Introduction">
            <p>
              Auto-Vyn ERP provides business and customer relationship
              management services for automotive dealerships and related
              businesses.
            </p>

            <p>
              We respect your privacy and are committed to handling personal
              information responsibly and transparently.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>
              Depending on how you interact with Auto-Vyn ERP, we may collect
              information that you voluntarily provide to us, including:
            </p>

            <ul className="list-disc space-y-2 pl-6">
              <li>Name</li>
              <li>Phone or mobile number</li>
              <li>Email address</li>
              <li>City or location information</li>
              <li>Vehicle interests and enquiry details</li>
              <li>Dealership or business-related information</li>
              <li>Appointment and follow-up information</li>
              <li>Information submitted through enquiry and lead forms</li>
              <li>
                Other information that you voluntarily provide while
                communicating with us
              </li>
            </ul>
          </Section>

          <Section title="3. Meta Lead Ads and Third-Party Lead Sources">
            <p>
              Auto-Vyn ERP may receive lead information submitted by users
              through Meta technologies, including Facebook and Instagram Lead
              Ads or Instant Forms.
            </p>

            <p>
              Depending on the fields included in a particular form, this may
              include information such as your name, phone number, email
              address, vehicle interest, location, and other responses you
              choose to submit.
            </p>

            <p>
              We use this information to process enquiries, manage leads,
              provide requested information, schedule follow-ups or
              appointments, and assist dealerships in communicating with
              prospective customers.
            </p>
          </Section>

          <Section title="4. How We Use Information">
            <p>We may use collected information to:</p>

            <ul className="list-disc space-y-2 pl-6">
              <li>Respond to customer enquiries</li>
              <li>Manage leads and customer relationships</li>
              <li>Contact customers regarding their enquiries</li>
              <li>Schedule appointments and follow-ups</li>
              <li>Provide information about vehicles, products, or services</li>
              <li>Operate and improve Auto-Vyn ERP</li>
              <li>Maintain records relating to customer interactions</li>
              <li>Protect our services from misuse and security threats</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
          </Section>

          <Section title="5. Sharing of Information">
            <p>
              We do not sell personal information.
            </p>

            <p>
              Information may be shared with authorized dealerships,
              employees, sales representatives, service providers, or
              technology providers when reasonably necessary to process an
              enquiry, provide requested services, operate Auto-Vyn ERP, or
              comply with applicable law.
            </p>

            <p>
              Access to information within Auto-Vyn ERP is intended to be
              limited to authorized users and organizations.
            </p>
          </Section>

          <Section title="6. Data Storage and Security">
            <p>
              We use reasonable administrative and technical measures designed
              to protect personal information against unauthorized access,
              disclosure, alteration, misuse, or loss.
            </p>

            <p>
              However, no method of electronic transmission or storage can be
              guaranteed to be completely secure.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain personal information only for as long as reasonably
              necessary for the purposes for which it was collected, for
              legitimate business requirements, or as required by applicable
              laws and regulations.
            </p>

            <p>
              Information may be deleted or anonymized when it is no longer
              reasonably required.
            </p>
          </Section>

          <Section title="8. Data Deletion Requests">
            <p>
              You may request deletion of personal information associated with
              Auto-Vyn ERP, subject to applicable legal and legitimate
              business retention requirements.
            </p>

            <p>
              Instructions for submitting a deletion request are available on
              our Data Deletion Instructions page.
            </p>

            <a
              href="/data-deletion"
              className="inline-flex font-medium text-primary hover:underline"
            >
              View Data Deletion Instructions
            </a>
          </Section>

          <Section title="9. Your Choices and Rights">
            <p>
              Depending on applicable law, you may have rights relating to
              access, correction, deletion, or restriction of certain personal
              information.
            </p>

            <p>
              You may contact us to submit an applicable privacy request.
            </p>
          </Section>

          <Section title="10. Third-Party Services">
            <p>
              Auto-Vyn ERP may integrate with third-party platforms and
              services. Those third parties may process information according
              to their own terms and privacy policies.
            </p>

            <p>
              This Privacy Policy applies to information processed by
              Auto-Vyn ERP and does not replace the privacy policies of
              third-party services.
            </p>
          </Section>

          <Section title="11. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy when our services, business
              practices, or legal requirements change.
            </p>

            <p>
              The latest version will be published on this page with an
              updated effective date.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about this Privacy Policy or would like to
              make a privacy-related request, please contact Auto-Vyn using the
              official contact information provided through our website or
              business communication channels.
            </p>
          </Section>

          <div className="border-t border-gray-200 pt-6 dark:border-input">
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href="/privacy-policy"
                className="font-medium text-primary hover:underline"
              >
                Privacy Policy
              </a>

              <a
                href="/terms"
                className="font-medium text-primary hover:underline"
              >
                Terms of Service
              </a>

              <a
                href="/data-deletion"
                className="font-medium text-primary hover:underline"
              >
                Data Deletion
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}