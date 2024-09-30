import React, { useState } from 'react';
import GoToRootWindow from '../../components/GoToRootWindow';
import PrinterFilters from './PrinterFilters';

const BarcodeIdLabel = () => {
  const [criteria, setCriteria] = useState(null);

  return (
    <div className="flex flex-column h-full px-2 pt-2">
      <div
        style={{ zIndex: 10000 }}
        className="flex justify-content-end align-items-center mr-2 mb-2"
      >
        <GoToRootWindow />
      </div>
      <PrinterFilters criteria={criteria} getCriteria={setCriteria} />
    </div>
  );
};

export default BarcodeIdLabel;
