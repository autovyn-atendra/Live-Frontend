import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | Auto-Vyn ERP",
  description:
    "Instructions for requesting deletion of personal information from Auto-Vyn ERP.",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-off px-4 py-10 dark:bg-black md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-2xl bg-header px-6 py-8 text-white shadow-one md:px-10 md:py-10">
          <p className="mb-2 text-sm font-medium text-front">
            Auto-Vyn ERP
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            Data Deletion Instructions
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
            You may request deletion of personal information associated with
            Auto-Vyn ERP by following the instructions below.
          </p>

          <p className="mt-4 text-xs text-white/70">
            Last updated: August 14, 2026
          </p>
        </div>

        <div className="space-y-8 rounded-2xl bg-white p-6 shadow-one dark:bg-dark md:p-10">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
              Requesting Data Deletion
            </h2>

            <div className="space-y-3 text-sm leading-7 text-aaa dark:text-body-color md:text-base">
              <p>
                If you have submitted personal information to Auto-Vyn ERP,
                including information submitted through a Facebook or
                Instagram lead form, you may request deletion of that
                information.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
              How to Submit a Request
            </h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-off p-5 dark:border-input dark:bg-black">
                <p className="mb-1 font-semibold text-header dark:text-white">
                  Step 1
                </p>
                <p className="text-sm leading-7 text-aaa dark:text-body-color md:text-base">
                  Contact Auto-Vyn through our official business support or
                  contact channel and state that you are requesting deletion
                  of your personal information.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-off p-5 dark:border-input dark:bg-black">
                <p className="mb-1 font-semibold text-header dark:text-white">
                  Step 2
                </p>
                <p className="text-sm leading-7 text-aaa dark:text-body-color md:text-base">
                  Provide sufficient information to help us locate your
                  record, such as the name, phone number, or email address that
                  you originally submitted.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-off p-5 dark:border-input dark:bg-black">
                <p className="mb-1 font-semibold text-header dark:text-white">
                  Step 3
                </p>
                <p className="text-sm leading-7 text-aaa dark:text-body-color md:text-base">
                  We may request reasonable verification before processing the
                  request to help protect information from unauthorized
                  deletion requests.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-off p-5 dark:border-input dark:bg-black">
                <p className="mb-1 font-semibold text-header dark:text-white">
                  Step 4
                </p>
                <p className="text-sm leading-7 text-aaa dark:text-body-color md:text-base">
                  Once the request has been verified, we will process the
                  deletion request subject to applicable legal, regulatory,
                  security, and legitimate record-retention requirements.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
              Information Received Through Meta
            </h2>

            <div className="space-y-3 text-sm leading-7 text-aaa dark:text-body-color md:text-base">
              <p>
                If your information was submitted through a Facebook or
                Instagram Lead Ad or Instant Form, please mention this when
                submitting your request. This helps us identify the relevant
                lead record.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
              Information We May Retain
            </h2>

            <div className="space-y-3 text-sm leading-7 text-aaa dark:text-body-color md:text-base">
              <p>
                Certain information may need to be retained where required by
                applicable law, for security and fraud prevention, dispute
                resolution, or legitimate business record-keeping
                requirements.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-header dark:text-white md:text-2xl">
              Contact
            </h2>

            <div className="space-y-3 text-sm leading-7 text-aaa dark:text-body-color md:text-base">
              <p>
                To request deletion, please contact Auto-Vyn through the
                official support or business contact information provided by
                Auto-Vyn.
              </p>
            </div>
          </section>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm leading-7 text-aaa dark:text-body-color md:text-base">
              When submitting a deletion request, do not send passwords,
              payment credentials, or other unnecessary sensitive
              information.
            </p>
          </div>

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