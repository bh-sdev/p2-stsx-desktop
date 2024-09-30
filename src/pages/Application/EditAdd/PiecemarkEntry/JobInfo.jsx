import { useTranslation } from 'react-i18next';

import AutoSizer from 'react-virtualized-auto-sizer';

import { ScrollPanel } from 'primereact/scrollpanel';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useContext } from 'react';
import { ContextPiecemarkEntry } from '.';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';

const JobInfo = ({ loading }) => {
  const { t } = useTranslation();
  const { job, addresses } = useContext(ContextPiecemarkEntry);

  const getAddressTypeByID = (ID) => addresses.find((address) => address.ID === ID)?.Type;

  return (
    <div className="h-full fadin flex flex-column relative">
      {!loading ? null : (
        <div className="h-full flex justify-content-center align-items-center absolute w-full z-5 bg-black-alpha-10">
          <ProgressSpinner
            style={{ width: '50px', height: '50px' }}
            pt={{
              circle: {
                style: { stroke: 'var(--primary-900)', strokeWidth: 3, animation: 'none' },
              },
            }}
          />
        </div>
      )}
      <AutoSizer className="flex-auto w-full">
        {() => (
          <ScrollPanel
            style={{ width: '100%', height: `100%` }}
            pt={{
              bary: {
                className: 'bg-bluegray-300',
              },
            }}
          >
            <div className="flex align-items-center mb-2 w-10">
              <div className="w-15rem">{t('sts.label.job.number')}:</div>
              <InputText
                value={job.Number}
                readOnly
                disabled
                className={classNames({
                  'w-12': true,
                })}
              />
            </div>
            <div className="flex align-items-center mb-2 w-10">
              <div className="w-15rem">{t('sts.label.customer.number')}:</div>
              <InputText
                value={job.CustomerNumber}
                readOnly
                disabled
                className={classNames({
                  'w-12': true,
                })}
              />
            </div>
            <div className="flex align-items-center mb-2 w-10">
              <div className="w-15rem">{t('sts.label.barcode.use.form')}:</div>
              <InputText
                value={job.BarcodeFormName}
                readOnly
                disabled
                className={classNames({
                  'w-12': true,
                })}
              />
            </div>
            <div className="mb-2 flex flex-row align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.weight')}:</div>
              <div className="flex align-items-center w-full">
                <InputNumber
                  value={job.Weight ? job.Weight.toFixed(3) : ''}
                  readOnly
                  disabled
                  className={classNames({
                    'w-12': true,
                  })}
                />
                <div className="mx-2">
                  {job.Metric ? t('sts.txt.weight.metric') : t('sts.txt.weight.imperial')}
                </div>
                <>
                  <Checkbox disabled readOnly inputId="Metric" checked={job.Metric} />
                  <label className="ml-2 flex-shrink-0">
                    {t('sts.txt.job.metric.weights.and.dimensions')}
                  </label>
                </>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.external_number')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.ExternalJobNumber}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.association')}:</div>
                  <InputText
                    value={job.Division}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.status')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.Status}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.ship.to')}:</div>
                  <InputText
                    value={getAddressTypeByID(job.ShipTo)}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.title')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.Title}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.bill.to')}:</div>
                  <InputText
                    value={getAddressTypeByID(job.BillTo)}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.structure')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.Structure}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.project.year')}:</div>
                  <InputText
                    value={job.ProjectYear}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.location')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.Location}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.job.hours')}:</div>
                  <InputText
                    value={job.Hours}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.care.of')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.CareOf}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.job.efficiency')}:</div>
                  <InputText
                    value={job.Efficiency}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.po')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.PO}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">{t('sts.label.job.rf.interface')}:</div>
                  <InputText
                    value={job.RFInterface}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.job.release.number')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.Release}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem"></div>
                  <div className="w-full">
                    <Checkbox disabled inputId="KeepMinors" checked={job.KeepMinors} />
                    <label htmlFor="KeepMinors" className="ml-2">
                      {`${t('sts.label.keep.minors.on.import')} (${t('sts.label.prefs')}=${
                        job.keepMinors ? t('sts.btn.yes') : t('sts.btn.no')
                      })`}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-2 flex align-items-center w-10">
              <div className="w-15rem">{t('sts.label.hardware.default.barcode.label.format')}:</div>
              <div className="flex align-items-center w-full">
                <InputText
                  value={job.DefaultBarcodeLabelFormat}
                  readOnly
                  disabled
                  className={classNames({
                    'w-5': true,
                  })}
                />
                <div className="flex align-items-center w-7 pl-2">
                  <div className="w-15rem">
                    {t('sts.label.hardware.default.barcode.labelase.format')}:
                  </div>
                  <InputText
                    value={job.DefaultLabelaseLabelFormat}
                    readOnly
                    disabled
                    className={classNames({
                      'w-12': true,
                    })}
                  />
                </div>
              </div>
            </div>
          </ScrollPanel>
        )}
      </AutoSizer>
    </div>
  );
};

export default JobInfo;
