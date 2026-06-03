import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()} | Domain: barbaprosystem.com</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Barba Construction CRM, barbaprosystem.com, and related services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
            <p>
              Barba Construction provides a platform for generating estimates, managing construction projects, and facilitating communication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. SMS & Messaging Program Terms (A2P 10DLC)</h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm space-y-3">
              <p>
                <strong>Program Description:</strong> When you opt-in to the service, we will send you an SMS message to confirm your signup. Our messaging program is used to send you important project updates, appointment reminders, and estimates related to Barba Construction services.
              </p>
              <p>
                <strong>Opt-Out:</strong> You can cancel the SMS service at any time. Just text <strong>"STOP"</strong>. After you send the SMS message "STOP" to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us. If you want to join again, just sign up as you did the first time and we will start sending SMS messages to you again.
              </p>
              <p>
                <strong>Help:</strong> If you are experiencing issues with the messaging program you can reply with the keyword <strong>HELP</strong> for more assistance, or you can get help directly by contacting us at our main office.
              </p>
              <p>
                <strong>Carrier Liability:</strong> Carriers are not liable for delayed or undelivered messages.
              </p>
              <p>
                <strong>Rates & Frequency:</strong> As always, <strong>message and data rates may apply</strong> for any messages sent to you from us and to us from you. Message frequency varies based on your active projects. If you have any questions about your text plan or data plan, it is best to contact your wireless provider. <strong>Consent to receive marketing or transactional text messages is not required as a condition of purchasing any goods or services.</strong>
              </p>
              <p>
                <strong>Privacy:</strong> For all questions about privacy, please read our <a href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</a>.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. User Conduct</h2>
            <p>
              This platform is intended for internal use by Barba Construction staff and for viewing estimates by authorized clients. Any unauthorized access, scraping, or misuse of the platform is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Limitation of Liability</h2>
            <p>
              Barba Construction shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of the service constitutes agreement to our revisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
