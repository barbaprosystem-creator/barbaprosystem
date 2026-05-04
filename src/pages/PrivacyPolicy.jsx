import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
            <p>
              Barba Construction ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you use our internal CRM application and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Data We Collect</h2>
            <p>
              As a private CRM application used for our internal operations, we collect and process business contact information, estimates, 
              project details, and billing information necessary to provide construction and remodeling services. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. How We Use Your Data</h2>
            <p>
              We use your data solely to communicate with you regarding your projects, issue estimates, process payments (via third-party integrations like QuickBooks), 
              and manage our internal operational schedule.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Third-Party Integrations</h2>
            <p>
              Our application integrates with Intuit QuickBooks to manage invoicing and accounting. Data synced with QuickBooks is governed by Intuit's privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact Barba Construction directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
