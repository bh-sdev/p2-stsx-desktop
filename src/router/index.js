import { Navigate } from 'react-router-dom';

import ROUTER_PATH from 'const/router.path';

import Application from 'pages/Application';
import Auth from 'pages/Auth';
import Home from 'pages/Application/Home';
import ErrorPage from 'pages/PageError';
import ProtectedRoute from './ProtectedRoute';

import ImportExport from 'pages/Application/ImportExport';
import EditAdd from 'pages/Application/EditAdd';
import ReportsLabels from 'pages/Application/ReportsLabels/index';
import STS from 'pages/Application/STS';

import ViewInfo from 'pages/Application/ViewInfo';
import ViewLoadInformation from 'pages/Application/ViewInfo/ViewLoadInformation';
import BrowseLoads from 'pages/Application/ViewInfo/ViewLoadInformation/BrowseLoads';
import EditCustomerInformation from 'pages/Application/EditAdd/EditCustomerInformation';
import EditEmployeeInformation from 'pages/Application/EditAdd/EditEmployeeInformation';
import EditCarrierInformation from 'pages/Application/EditAdd/EditCarrierInformation';
import EditRoutingCodes from 'pages/Application/EditAdd/EditRoutingCodes';
import EditStatusCodes from 'pages/Application/EditAdd/EditStatusCodes';
import DivisionManagement from 'pages/Application/STS/DivisionLicenseManagement/DivisionManagement';
import LicenseManagement from 'pages/Application/STS/DivisionLicenseManagement/LicenseManagement';
import LogonAccessManagement from 'pages/Application/STS/LogonAccessManagement';
import MCLabelDestinations from 'pages/Application/STS/LogonAccessManagement/MCLabelDestinations';
import EditEmployeeClassInfo from 'pages/Application/EditAdd/EditEmployeeClassInfo';
import BarCodePrinterPrefs from 'pages/Application/STS/BarCodePrinterPrefs';
import EditJobInformation from 'pages/Application/EditAdd/EditJobInformation';
import KissImport from 'pages/Application/ImportExport/KissImport';
import KissImportPiecmarkDeletion from 'pages/Application/ImportExport/KissImport/PiecmarkDeletion';
import ApplicationPermissions from 'pages/Application/STS/ApplicationPermissions';
import RawMaterialLabels from 'pages/Application/ReportsLabels/RawMaterialLabels';
import RawMaterialLabelsSelectPrint from '../pages/Application/ReportsLabels/RawMaterialLabels/SelectPrint';
import BarcodeIdLabel from 'pages/Application/ReportsLabels/BarcodeIdLabel';
import TableSettings from 'pages/Application/TableSettings';
import ViewLog from 'pages/Application/STS/ViewLog';
import Filters from 'pages/Application/STS/ViewLog/Filters';
import Preferences from 'pages/Application/STS/Preferences';
import ViewLogonLicensesInfo from 'pages/Application/STS/ViewLogonLicensesInfo';
import SelectPrint from 'pages/Application/ReportsLabels/BarcodeIdLabel/SelectPrint';
import ActiveRecordsDelete from 'pages/Application/EditAdd/ActiveRecordsDelete';
import PiecmarkDeletion from 'pages/Application/EditAdd/ActiveRecordsDelete/PiecmarkDeletion';
import RecallDeleteRecords from 'pages/Application/EditAdd/RecallDeleteRecords';
import SelectedToRecall from 'pages/Application/EditAdd/RecallDeleteRecords/SelectedToRecall';
import ShipIdNumbers from 'pages/Application/EditAdd/ShipIdNumbers';
import PiecemarkEntry from 'pages/Application/EditAdd/PiecemarkEntry';

const MAIN_ROUTES = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Application />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: ROUTER_PATH.home,
        element: <Home />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTER_PATH.viewInfo} replace />,
          },
          {
            path: ROUTER_PATH.importExport,
            element: <ImportExport />,
            children: [],
          },
          {
            path: ROUTER_PATH.editAdd,
            element: <EditAdd />,
            children: [],
          },
          {
            path: ROUTER_PATH.viewInfo,
            element: <ViewInfo />,
            children: [],
          },
          {
            path: ROUTER_PATH.reportLabels,
            element: <ReportsLabels />,
            children: [],
          },
          {
            path: ROUTER_PATH.settings,
            element: <STS />,
            children: [],
          },
        ],
      },
      {
        path: ROUTER_PATH.piecemarkEntry,
        element: (
          <ProtectedRoute>
            <PiecemarkEntry />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.viewLoadInformation,
        element: (
          <ProtectedRoute>
            <ViewLoadInformation />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editCustomerInformation,
        element: (
          <ProtectedRoute>
            <EditCustomerInformation />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editJobInfo,
        element: (
          <ProtectedRoute>
            <EditJobInformation />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editEmployeeInformation,
        element: (
          <ProtectedRoute>
            <EditEmployeeInformation />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editEmployeeClassInfo,
        element: (
          <ProtectedRoute>
            <EditEmployeeClassInfo />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editStatusCodes,
        element: (
          <ProtectedRoute>
            <EditStatusCodes />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editRoutingCodes,
        element: (
          <ProtectedRoute>
            <EditRoutingCodes />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.editCarrierInformation,
        element: (
          <ProtectedRoute>
            <EditCarrierInformation />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.preferences,
        element: (
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.barCodePrinterPrefs,
        element: (
          <ProtectedRoute>
            <BarCodePrinterPrefs />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.applicationPermissions,
        element: (
          <ProtectedRoute>
            <ApplicationPermissions />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.divisionManagement,
        element: (
          <ProtectedRoute>
            <DivisionManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.logonAccessManagement,
        element: (
          <ProtectedRoute>
            <LogonAccessManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.mcLabelDestination}/:id`,
        element: (
          <ProtectedRoute>
            <MCLabelDestinations />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.licenseManagement,
        element: (
          <ProtectedRoute>
            <LicenseManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.kissImport,
        element: (
          <ProtectedRoute>
            <KissImport />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.kissImportDeletion}/:id`,
        element: (
          <ProtectedRoute>
            <KissImportPiecmarkDeletion />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.viewLog,
        element: (
          <ProtectedRoute>
            <ViewLog />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.viewLogFilters,
        element: (
          <ProtectedRoute>
            <Filters />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.shipIdNumbers,
        element: (
          <ProtectedRoute>
            <ShipIdNumbers />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.browseLoads}/:id`,
        element: (
          <ProtectedRoute>
            <BrowseLoads />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.rawMaterialLabels}`,
        element: (
          <ProtectedRoute>
            <RawMaterialLabels />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.rawMaterialLabels}/${ROUTER_PATH.printSelected}/:id`,
        element: (
          <ProtectedRoute>
            <RawMaterialLabelsSelectPrint />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.barcodeIdLabel}`,
        element: (
          <ProtectedRoute>
            <BarcodeIdLabel />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.activeRecordDeletes}`,
        element: (
          <ProtectedRoute>
            <ActiveRecordsDelete />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.activeRecordDeletes}/:id`,
        element: (
          <ProtectedRoute>
            <PiecmarkDeletion />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.printSelected}/:id`,
        element: (
          <ProtectedRoute>
            <SelectPrint />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.deletedRecords}`,
        element: (
          <ProtectedRoute>
            <RecallDeleteRecords />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.jobPiecemarkRecall}/:id`,
        element: (
          <ProtectedRoute>
            <SelectedToRecall />
          </ProtectedRoute>
        ),
      },
      {
        path: `${ROUTER_PATH.tableSettings}/:id`,
        element: (
          <ProtectedRoute>
            <TableSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTER_PATH.viewLogonLicensesInfo,
        element: (
          <ProtectedRoute>
            <ViewLogonLicensesInfo />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTER_PATH.auth,
    element: <Auth />,
  },
];

export { MAIN_ROUTES };
