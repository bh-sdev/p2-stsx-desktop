import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Card } from 'primereact/card';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ServiceTokenStorage } from 'services';
import { login, loginFields, logout } from 'api';
import IconLogo from 'assets/images/logo.png';
import { LOCAL_STORAGE_VARIABLES } from 'const';
import ServiceUserStorage from 'services/ServiceUserStorage';
import useActions from '../../hooks/useActions';
import { Dialog } from 'primereact/dialog';
import NewLicense from './NewLicense';

const LoginSchema = yup.lazy((values) => {
  return yup.object({
    CompanyName: !Object.prototype.hasOwnProperty.call(values, 'CompanyName')
      ? yup.string().trim()
      : yup.string().trim().required(),
    UserName: yup.string().trim().required(),
    Password: yup.string().trim().required(),
  });
});

let defaultValues = {
  UserName: '',
  Password: '',
};

const Auth = () => {
  const refToast = useRef();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setPermissions } = useActions();
  const [hasCompany, setHasCompany] = useState(false);
  const [processLogin, setProcessLogin] = useState(false);
  const [processExit, setProcessExit] = useState(false);
  const [isNewLicense, setIsNewLicense] = useState(false);
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  useEffect(() => {
    localStorage.removeItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY);
    ServiceTokenStorage.hasToken() && navigate('/home');
    loadFields();
  }, [navigate]);

  const loadFields = async () => {
    try {
      const { Fields } = await loginFields();
      const isCompanyExist = Fields.includes('CompanyName');
      setHasCompany(isCompanyExist);
      if (isCompanyExist) {
        reset({ companyName: '', ...defaultValues });
      }
    } finally {
      setProcessLogin(false);
    }
  };

  const onClickLogin = async (data) => {
    try {
      setProcessLogin(true);
      const { Token, Permissions, Lang, ...rest } = await login({ ...data, AppType: 'desktop' });
      setPermissions(Permissions);
      ServiceTokenStorage.setToken(Token);
      ServiceUserStorage.setUser({ ...rest, UserName: data.UserName });
      navigate('/home');
      await i18n.changeLanguage(Lang);
      localStorage.setItem('i18nextLng', Lang);
    } catch (e) {
      if (data?.License && e.response.data.Code === 403) {
        return confirmDialog({
          closable: false,
          message: t('sts.txt.license.invalid'),
          header: t('sts.txt.notice'),
          acceptLabel: t('sts.btn.ok'),
          rejectClassName: 'hidden',
          icon: 'pi pi-times-circle text-yellow-500',
        });
      }
      if (e.response.data.Code === 403) {
        setIsNewLicense(true);
        return;
      }
      confirmDialog({
        closable: false,
        message: e.response.data.Detail || e.response.data.Message,
        header: t('1291'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setProcessLogin(false);
    }
  };

  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };

  const clearSession = async (e) => {
    e.preventDefault();
    setProcessExit(true);
    logout();
    setProcessExit(false);
    ServiceTokenStorage.clearSessionToken();
    sessionStorage.removeItem(LOCAL_STORAGE_VARIABLES.SESSION_STORAGE_HISTORY);
  };

  return (
    <div id="login" className="page fadein flex justify-content-center align-items-center">
      <ConfirmDialog />
      <Dialog showHeader={false} visible={isNewLicense} style={{ minWidth: 600 }} closable={false}>
        <NewLicense
          update={(License) => {
            setIsNewLicense(false);
            onClickLogin({ ...getValues(), License });
          }}
          close={() => setIsNewLicense(false)}
        />
      </Dialog>
      <Toast ref={refToast} />
      <Card className="md:w-25rem">
        <div className="logo mb-4 flex justify-content-center">
          <img src={IconLogo} alt="STS" />
        </div>
        <form onSubmit={handleSubmit(onClickLogin)} className="p-fluid">
          {hasCompany && (
            <div className="mb-5">
              <span className="p-float-label">
                <Controller
                  name="companyName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputText
                      id={field.name}
                      {...field}
                      autoFocus
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className={classNames({
                        'p-invalid': fieldState.invalid,
                      })}
                    />
                  )}
                />
                <label
                  htmlFor="companyName"
                  className={classNames({ 'p-error': errors.companyName })}
                >
                  {t('sts.label.company')}
                </label>
              </span>
              {getFormErrorMessage('companyName')}
            </div>
          )}
          <div className="mb-5">
            <span className="p-float-label">
              <Controller
                name="UserName"
                control={control}
                render={({ field, fieldState }) => (
                  <InputText
                    id={field.name}
                    {...field}
                    className={classNames({
                      'p-invalid': fieldState.invalid,
                    })}
                  />
                )}
              />
              <label htmlFor="UserName" className={classNames({ 'p-error': errors.UserName })}>
                {t('sts.label.user.name')}
              </label>
            </span>
            {getFormErrorMessage('UserName')}
          </div>
          <div className="mb-5">
            <span className="p-float-label">
              <Controller
                name="Password"
                control={control}
                render={({ field, fieldState }) => (
                  <Password
                    id={field.name}
                    {...field}
                    feedback={false}
                    toggleMask
                    className={classNames({
                      'p-invalid': fieldState.invalid,
                    })}
                  />
                )}
              />
              <label htmlFor="Password" className={classNames({ 'p-error': errors.Password })}>
                {t('sts.label.password')}
              </label>
            </span>
            {getFormErrorMessage('Password')}
          </div>
          <div className="flex gap-2">
            {ServiceTokenStorage.getSessionToken() && (
              <Button
                type="button"
                disabled={!ServiceTokenStorage.getSessionToken()}
                loading={processExit}
                label={t('sts.btn.exit')}
                size="small"
                severity="danger"
                onClick={clearSession}
              />
            )}
            <Button
              label={t('sts.btn.login')}
              disabled={!isValid}
              type="submit"
              size="small"
              loading={processLogin}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
