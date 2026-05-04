import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Barba Construction CRM and related services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
            <p>
              Barba Construction provides a private CRM platform for generating estimates, managing projects, and facilitating invoicing via third-party providers (such as QuickBooks).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. User Conduct</h2>
            <p>
              This platform is intended for internal use by Barba Construction staff and for viewing estimates by authorized clients. Any unauthorized access, scraping, or misuse of the platform is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Limitation of Liability</h2>
            <p>
              Barba Construction shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of the service constitutes agreement to our revisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
