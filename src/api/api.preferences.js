import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { preferences } = ENDPOINTS;

export const getPreferences = (params) => AuthorizedAPI.get(preferences.root, params);

export const preferencesPurchaseOrderGet = (params) =>
  AuthorizedAPI.get(preferences.purchaseOrder, { params });

export const preferencesPurchaseOrderUpdate = (data) =>
  AuthorizedAPI.put(preferences.purchaseOrder, data);

export const preferencesFabSuiteGet = (params) =>
  AuthorizedAPI.get(preferences.fabSuite.root, { params });

export const preferencesFabSuiteUpdate = (data) =>
  AuthorizedAPI.put(preferences.fabSuite.root, data);

export const preferencesFabSuiteTestConnection = (data) =>
  AuthorizedAPI.post(preferences.fabSuite.connection, data);

export const preferencesDisplayUpdate = (data) => AuthorizedAPI.put(preferences.display.root, data);

export const preferencesDisplayGet = () => AuthorizedAPI.get(preferences.display.root);

export const preferencesDisplayLangsGet = () => AuthorizedAPI.get(preferences.display.refLangs);

export const preferencesWirelessUpdate = (data) => AuthorizedAPI.put(preferences.wireless, data);

export const preferencesWirelessGet = () => AuthorizedAPI.get(preferences.wireless);

export const preferencesDatPathsGet = () => AuthorizedAPI.get(preferences.dataPaths);

export const preferencesHardwareGet = () => AuthorizedAPI.get(preferences.hardware.root);

export const preferencesHardwareUpdate = (data) =>
  AuthorizedAPI.put(preferences.hardware.root, data);

export const preferencesHardwareLoadNumbersGet = () =>
  AuthorizedAPI.get(preferences.hardware.refLoadNumbers);

export const preferencesHardwareBarcodeLabelTypesGet = () =>
  AuthorizedAPI.get(preferences.hardware.refBarcodeLabelTypes);

export const preferencesMaterialTypeGet = () => AuthorizedAPI.get(preferences.materialType.root);

export const preferencesMaterialTypeUpdate = (data) =>
  AuthorizedAPI.put(preferences.materialType.root, data);

export const preferencesMaterialTypeValidationTypes = () =>
  AuthorizedAPI.get(preferences.materialType.refValidateAgainstTypes);

export const preferencesMiscInfoGet = () => AuthorizedAPI.get(preferences.miscInfo.root);

export const preferencesMiscInfoUpdate = (data) =>
  AuthorizedAPI.put(preferences.miscInfo.root, data);

export const preferencesMiscInfoCustomerNumbersGet = (params) =>
  AuthorizedAPI.get(preferences.miscInfo.refCustomerNumbers, { params });

export const preferencesMiscInfoInstalledAtTypesGet = () =>
  AuthorizedAPI.get(preferences.miscInfo.refInstalledAtTypes);

export const preferencesMiscInfoRoutingCodesGet = (params) =>
  AuthorizedAPI.get(preferences.miscInfo.refRoutingCodes, { params });
