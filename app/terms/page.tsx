import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Auto-Vyn ERP",
  description: "Terms of Service for Auto-Vyn ERP.",
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
      {title}
    </h2>

    <div className="space-y-3 text-sm leading-7 text-aaa dark:text-body-color md:text-base">
      {children}
    </div>
  </section>
);

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-off px-4 py-10 dark:bg-black md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-2xl bg-header px-6 py-8 text-white shadow-one md:px-10 md:py-10">
          <p className="mb-2 text-sm font-medium text-front">
            Auto-Vyn ERP
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            Terms of Service
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
            These Terms of Service describe the terms applicable to the use of
            Auto-Vyn ERP and related services.
          </p>

          <p className="mt-4 text-xs text-white/70">
            Last updated: August 14, 2026
          </p>
        </div>

        <div className="space-y-9 rounded-2xl bg-white p-6 shadow-one dark:bg-dark md:p-10">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Auto-Vyn ERP, you agree to comply with
              these Terms of Service and applicable laws and regulations.
            </p>
          </Section>

          <Section title="2. About Auto-Vyn ERP">
            <p>
              Auto-Vyn ERP is a business software platform designed to assist
              automotive dealerships and related businesses with customer,
              lead, sales, service, appointment, follow-up, and operational
              management activities.
            </p>
          </Section>

          <Section title="3. Authorized Use">
            <p>
              You may use Auto-Vyn ERP only for lawful business purposes and
              in accordance with the permissions granted to your account or
              organization.
            </p>

            <p>
              You must not attempt to gain unauthorized access to accounts,
              systems, data, or features.
            </p>
          </Section>

          <Section title="4. Account Responsibility">
            <p>
              Users are responsible for maintaining the confidentiality of
              their account credentials and for activities performed through
              their accounts.
            </p>

            <p>
              Suspected unauthorized account access should be reported
              promptly.
            </p>
          </Section>

          <Section title="5. Customer and Lead Information">
            <p>
              Auto-Vyn ERP may process customer and lead information supplied
              directly by users, dealerships, forms, advertising platforms,
              integrations, or other authorized sources.
            </p>

            <p>
              Users and organizations using Auto-Vyn ERP are responsible for
              ensuring that their collection and use of such information
              complies with applicable laws and platform requirements.
            </p>
          </Section>

          <Section title="6. Third-Party Integrations">
            <p>
              Auto-Vyn ERP may integrate with third-party services, including
              advertising, communication, analytics, and other business
              platforms.
            </p>

            <p>
              Availability and operation of third-party services are subject
              to the respective provider&apos;s terms, policies, and technical
              availability.
            </p>
          </Section>

          <Section title="7. Service Availability">
            <p>
              We aim to provide reliable access to Auto-Vyn ERP, but we do not
              guarantee uninterrupted or error-free availability.
            </p>

            <p>
              Maintenance, infrastructure issues, third-party outages, or
              other circumstances may temporarily affect service availability.
            </p>
          </Section>

          <Section title="8. Prohibited Activities">
            <p>Users must not use Auto-Vyn ERP to:</p>

            <ul className="list-disc space-y-2 pl-6">
              <li>Violate applicable laws or regulations</li>
              <li>Access information without authorization</li>
              <li>Distribute malicious software or harmful content</li>
              <li>Interfere with the security or operation of the service</li>
              <li>Misuse customer or lead information</li>
              <li>Attempt to bypass security or access controls</li>
            </ul>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              Auto-Vyn ERP, including its software, branding, interface,
              documentation, and related materials, may be protected by
              intellectual property laws.
            </p>

            <p>
              No ownership rights are transferred merely through use of the
              service.
            </p>
          </Section>

          <Section title="10. Privacy">
            <p>
              Our handling of personal information is described in our Privacy
              Policy.
            </p>

            <a
              href="/privacy-policy"
              className="inline-flex font-medium text-primary hover:underline"
            >
              View Privacy Policy
            </a>
          </Section>

          <Section title="11. Suspension or Termination">
            <p>
              Access may be restricted or terminated where reasonably
              necessary for security, misuse prevention, contractual
              requirements, non-payment where applicable, or violation of
              these Terms.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>
              These Terms may be updated from time to time. The latest version
              will be published on this page with the applicable update date.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Questions concerning these Terms may be submitted through
              Auto-Vyn&apos;s official business contact channels.
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