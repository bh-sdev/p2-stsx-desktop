import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import AutoSizer from 'react-virtualized-auto-sizer';

import { ScrollPanel } from 'primereact/scrollpanel';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { RadioButton } from 'primereact/radiobutton';

const JOB_NUMBER = 'J1234567890123456789012345678';

const BarCodeStructure = ({ isEdit, control, getValues, setValue, watch }) => {
  const { t } = useTranslation();
  const watchFields = watch([
    'BarcodePreambleLength',
    'BarcodeIncludePrefix',
    'BarcodeJobStart',
    'BarcodeStartingAtPosition',
  ]);
  const watchBarcodeJobStart = watch('BarcodeJobStart');
  const [preamble, setPreamble] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [sample, setSample] = useState('');

  useEffect(() => {
    generateBarcode();
  }, [watchFields]);

  useEffect(() => {
    if (isEdit) {
      if (watchFields[2] === t('sts.txt.barcode.start.position') && !watchFields[3]) {
        setValue('BarcodeStartingAtPosition', 1);
      } else if (watchFields[2] !== t('sts.txt.barcode.start.position')) {
        setValue('BarcodeStartingAtPosition', null);
      } else {
        setValue('BarcodeStartingAtPosition', watchFields[3]);
      }
    }
  }, [watchBarcodeJobStart]);

  const generateBarcode = () => {
    const BARCODE_LENGTH = 10;
    const SERIAL_LENGTH = BARCODE_LENGTH - getValues().BarcodePreambleLength;
    const PREAMBLE =
      getValues().BarcodeIncludePrefix === 'Include Prefix' ? getValues().BarcodePrefix : '';

    let jobLength = getValues().BarcodePreambleLength === 4 ? 2 : 3;

    if (PREAMBLE === '') jobLength += 2;

    setValue('BarcodeJobLength', jobLength);

    setSerialNumber(new Array(BARCODE_LENGTH).fill('S').join('').substring(0, SERIAL_LENGTH));

    let jobText = '';
    if (getValues().BarcodeJobStart === t('sts.txt.barcode.first.characters')) {
      jobText = JOB_NUMBER.substring(0, jobLength);
    } else if (getValues().BarcodeJobStart === t('sts.txt.barcode.last.characters')) {
      var startPos = jobLength > JOB_NUMBER.length ? 0 : JOB_NUMBER.length - jobLength;
      jobText = JOB_NUMBER.substring(startPos, JOB_NUMBER.length);
    } else {
      const jobStart = getValues().BarcodeStartingAtPosition - 1;
      jobText = JOB_NUMBER.substring(jobStart, jobStart + jobLength);
    }

    while (jobText.length < jobLength) {
      jobText = '0' + jobText;
    }

    setPreamble(PREAMBLE + jobText);
    setSample(preamble + serialNumber);
  };

  return (
    <div className="h-full flex flex-column">
      <div className="flex-auto flex flex-column pb-2">
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
              <div className="flex-auto w-30rem">
                <form className="p-fluid">
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.customer.number')}:</div>
                      <Controller
                        name="CustomerNumber"
                        control={control}
                        render={({ field }) => <div className="w-full">{field.value}</div>}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.include.prefix')}:</div>
                      <Controller
                        name="BarcodeIncludePrefix"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            {...field}
                            tabIndex={1}
                            options={[
                              {
                                label: t('sts.txt.barcode.include.prefix'),
                                value: 'Include Prefix',
                              },
                              {
                                label: t('sts.txt.barcode.exclude.prefix'),
                                value: 'Exclude Prefix',
                              },
                            ]}
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                            })}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.prefix')}:</div>
                      <Controller
                        name="BarcodePrefix"
                        control={control}
                        render={({ field }) => <div className="w-full">{field.value}</div>}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.preamble.length')}:</div>
                      <Controller
                        name="BarcodePreambleLength"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 w-full">
                            <div className="flex align-items-center">
                              <RadioButton
                                tabIndex={2}
                                disabled={!isEdit}
                                inputId="BarcodePreambleLength"
                                name="BarcodePreambleLength"
                                value={4}
                                onChange={(e) => field.onChange(e.value)}
                                checked={field.value === 4}
                              />
                              <label htmlFor="BarcodePreambleLength" className="ml-2">
                                4
                              </label>
                            </div>
                            <div className="flex align-items-center">
                              <RadioButton
                                tabIndex={3}
                                disabled={!isEdit}
                                inputId="BarcodePreambleLength"
                                name="BarcodePreambleLength"
                                value={5}
                                onChange={(e) => field.onChange(e.value)}
                                checked={field.value === 5}
                              />
                              <label htmlFor="BarcodePreambleLength" className="ml-2">
                                5
                              </label>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.job.start')}:</div>
                      <Controller
                        name="BarcodeJobStart"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            {...field}
                            tabIndex={4}
                            options={[
                              {
                                label: t('sts.txt.barcode.first.characters'),
                                value: 'First Characters of Job Number',
                              },
                              {
                                label: t('sts.txt.barcode.last.characters'),
                                value: 'Last Characters of Job Number',
                              },
                              {
                                label: t('sts.txt.barcode.start.position'),
                                value: 'Job Number. Starting at Position',
                              },
                            ]}
                            disabled={!isEdit}
                            className={classNames({
                              'w-full': true,
                            })}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.starting.at.position')}:</div>
                      <Controller
                        name="BarcodeStartingAtPosition"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            {...field}
                            tabIndex={5}
                            options={new Array(50).fill('').map((_, index) => index + 1)}
                            disabled={
                              !isEdit ||
                              getValues().BarcodeJobStart !== t('sts.txt.barcode.start.position')
                            }
                            className={classNames({
                              'w-full': true,
                            })}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.job.length')}:</div>
                      <Controller
                        name="BarcodeJobLength"
                        control={control}
                        render={({ field }) => <div className="w-full">{field.value}</div>}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.txt.barcode.example')}:</div>
                      <div className="w-full">{sample}</div>
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.prefix')}:</div>
                      <Controller
                        name="BarcodePrefix"
                        control={control}
                        render={({ field }) => <div className="w-full">{field.value}</div>}
                      />
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.job.number')}:</div>
                      <div className="w-full">{JOB_NUMBER}</div>
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.serial.number')}:</div>
                      <div className="w-full">{serialNumber}</div>
                    </div>
                  </div>
                  <div className="my-1">
                    <div className="flex align-items-center">
                      <div className="mr-4 w-7">{t('sts.label.barcode.preamble')}:</div>
                      <div className="w-full">{preamble}</div>
                    </div>
                  </div>
                </form>
              </div>
            </ScrollPanel>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default BarCodeStructure;
