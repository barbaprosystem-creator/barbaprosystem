import React, { useEffect } from 'react';
import ServiceConfigurator from '../components/estimator/ServiceConfigurator';
import ReceiptSidebar from '../components/estimator/ReceiptSidebar';
import { useEstimatorStore } from '../store/useEstimatorStore';

export default function Estimator() {
  const fetchPrices = useEstimatorStore(state => state.fetchPrices);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Nuevo Estimado</h1>
        <p className="admin-page-subtitle">Configura los servicios y materiales para el cliente</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start mt-4">
        <div className="flex-1 min-w-0 w-full">
          <ServiceConfigurator />
        </div>
        <div className="w-full xl:w-[400px] flex-none sticky top-8">
          <ReceiptSidebar />
        </div>
      </div>
    </div>
  );
}
