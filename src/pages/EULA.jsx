import React from 'react';

export default function EULA() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black mb-6">End-User License Agreement (EULA)</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">1. License Grant</h2>
            <p>
              Barba Construction grants you a revocable, non-exclusive, non-transferable, limited license to access and use the CRM application strictly in accordance with the terms of this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Restrictions</h2>
            <p>
              You agree not to, and you will not permit others to: license, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose or otherwise commercially exploit the Application or make the Application available to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Intellectual Property</h2>
            <p>
              The Application, including without limitation all copyrights, patents, trademarks, trade secrets and other intellectual property rights are, and shall remain, the sole and exclusive property of Barba Construction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Consent to Use of Data</h2>
            <p>
              You agree that Barba Construction may collect and use technical data and related information to facilitate the provision of software updates, product support, and integration with third-party services like QuickBooks.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
