import ENDPOINTS from 'const/endpoints';
import { BaseAPI, AuthorizedAPI } from './general';

const { auth } = ENDPOINTS;

export const loginFields = () => BaseAPI.get(auth.loginFields);

export const login = (data) => BaseAPI.post(auth.login, data);

export const logout = () => AuthorizedAPI.post(auth.logout);

export const register = (data) => BaseAPI.post(auth.register, data);

export const getRefreshToken = (refreshToken) => BaseAPI.get(auth.refreshToken, { refreshToken });
