import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()} | Domain: barbaprosystem.com</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
            <p>
              Barba Construction ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you use our website (barbaprosystem.com), CRM application, and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Data We Collect</h2>
            <p>
              We collect and process business contact information (name, phone number, email address, physical address), estimates, 
              project details, and billing information necessary to provide construction and remodeling services. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. How We Use Your Data</h2>
            <p>
              We use your data solely to communicate with you regarding your projects, issue estimates, process payments, send important service updates via SMS, 
              and manage our internal operational schedule.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. SMS and Messaging Privacy (A2P 10DLC Compliance)</h2>
            <p className="font-semibold text-blue-900 bg-blue-50 p-4 rounded-lg border border-blue-100">
              We highly value your privacy. No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. 
              All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties under any circumstances.
            </p>
            <p className="mt-3">
              If you have opted in to receive SMS text messages from Barba Construction, we will only use your phone number to send you relevant information regarding your estimate, project status, or appointment reminders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Third-Party Integrations</h2>
            <p>
              Our application integrates with third-party providers (such as QuickBooks) to manage invoicing and accounting. Data synced with such providers is governed by their respective privacy policies. We do not share your phone number with these providers for marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact Barba Construction directly via barbaprosystem.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
