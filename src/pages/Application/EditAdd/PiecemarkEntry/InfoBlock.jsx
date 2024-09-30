import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';

import {
  piecemarkEntryCreate,
  piecemarkEntryDelete,
  piecemarkEntryGet,
  piecemarkEntryIDInfo,
  piecemarkEntryPiecemarkInfo,
  piecemarkEntryUpdate,
  piecemarkEntryIDInfoUpdate,
  piecemarkEntryPiecemarkInfoUpdate,
} from 'api';
import { removeEmptyParams } from 'api/general';
import { KgToLbs, LbsToKg, noEmptyStringValues, noNullValues, noSpaceOnStart } from 'utils';
import { ContextPiecemarkEntry, PIECEMARK_EMPTY } from '.';

import Piecemark from './Piecemark';
import JobInfo from './JobInfo';
import IdInfo from './IdInfo';
import PiecemarkInfo from './PiecemarkInfo';
import { GlobalContext } from 'pages/Application';
import useTabsNavigation from 'hooks/useTabsNavigation';
import { FRACTIONS } from 'const';

const PiecemarkEntryValidationSchema = (imperial = false) =>
  yup.object({
    PiecemarkEntry: yup.object({
      SheetNumber: yup.string().required(),
      Material: yup.string().required(),
      Piecemark: yup.string().required(),
      ParentPiecemark: yup.string().required(),
      Qty: yup.number().min(1),
      NumberOfLabels: yup.number().test('less-or-equal-than', function (value) {
        const { Quantity } = this.parent;
        return Quantity >= value;
      }),
      ...(!imperial
        ? {}
        : {
            Width: yup.string().test('width-imperial', function (value) {
              if (!value) return true;
              const string = value
                ?.replace(/\D/g, ' ')
                .split(' ')
                .filter((val) => !!val)
                .map(Number);
              if (string.length === 1 || string.length > 3) return false;
              if (string.length === 2) {
                return true;
              }
              if (string.length === 3) {
                return (
                  string[1] !== 0 &&
                  string[1] < string[2] &&
                  FRACTIONS.includes(string[2]) &&
                  string[2] % 2 === 0
                );
              }
            }),
            ItemLength: yup.string().test('length-imperial', function (value) {
              if (!value) return true;
              const string = value
                ?.replace(/\D/g, ' ')
                .split(' ')
                .filter((val) => !!val)
                .map(Number);
              if (string.length === 1 || string.length > 4) return false;
              if (string.length === 2) {
                return true;
              }
              if (string.length === 3) {
                return (
                  string[1] !== 0 &&
                  string[1] < string[2] &&
                  FRACTIONS.includes(string[2]) &&
                  string[2] % 2 === 0
                );
              }
              if (string.length === 4) {
                return (
                  string[2] !== 0 &&
                  string[2] < string[3] &&
                  FRACTIONS.includes(string[3]) &&
                  string[3] % 2 === 0
                );
              }
              return true;
            }),
          }),
    }),
  });

const InfoBlock = () => {
  const { t } = useTranslation();
  const {
    job,
    created,
    updated,
    deleted,
    selected,
    setSelected,
    setIsEdit,
    setIsNew,
    cancel,
    isEdit,
    isNew,
    Delete,
    Edit,
    setCommonData,
    commonData,
  } = useContext(ContextPiecemarkEntry);
  const { refToast } = useContext(GlobalContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setIsBusy] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { isValid, isDirty, dirtyFields },
  } = useForm({
    mode: 'onChange',
    defaultValues: PIECEMARK_EMPTY,
    resolver: yupResolver(PiecemarkEntryValidationSchema(!job.Metric)),
  });
  const [loading, setLoading] = useState(false);

  const refSelectedID = useRef();
  const refTabView = useRef();

  useTabsNavigation({ refTabView, set: setActiveIndex, length: 4 });

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      const formMapIndex = {
        0: 'PiecemarkEntry',
        2: 'PiecemarkInfo',
        3: 'IDInfo',
      };
      if (name && formMapIndex[activeIndex] === name.split('.')[0]) {
        const activeFormData = value[formMapIndex[activeIndex]];
        const dirtyField = name.split('.')[1];
        for (let formIndx in formMapIndex) {
          if (Number(formIndx) === activeIndex) continue;
          if (dirtyField === 'WeightEach') {
            if (
              value[formMapIndex[formIndx]]['ItemWeightKg'] !== undefined &&
              value[formMapIndex[formIndx]]['ItemWeightLb'] !== undefined
            ) {
              setValue(
                `${formMapIndex[formIndx]}.ItemWeightKg`,
                !job.Metric
                  ? LbsToKg(activeFormData[dirtyField])
                  : Number(activeFormData[dirtyField]),
                {
                  shouldDirty: true,
                },
              );
              setValue(
                `${formMapIndex[formIndx]}.ItemWeightLb`,
                job.Metric
                  ? KgToLbs(activeFormData[dirtyField])
                  : Number(activeFormData[dirtyField]),
                {
                  shouldDirty: true,
                },
              );
            }
            continue;
          }

          if (dirtyField === 'LoadNumber') {
            if (value[formMapIndex[formIndx]]['CurrentLoadNumber'] !== undefined) {
              setValue(`${formMapIndex[formIndx]}.CurrentLoadNumber`, activeFormData[dirtyField], {
                shouldDirty: true,
              });
            }
            continue;
          }

          if (
            value[formMapIndex[formIndx]][dirtyField] !== undefined &&
            value[formMapIndex[formIndx]][dirtyField] !== activeFormData[dirtyField]
          ) {
            setValue(`${formMapIndex[formIndx]}.${dirtyField}`, activeFormData[dirtyField], {
              shouldDirty: true,
            });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [activeIndex]);

  useEffect(() => {
    if (selected) {
      selected.ID !== refSelectedID.current && init();
    } else {
      reset(PIECEMARK_EMPTY);
    }
  }, [selected]);

  const init = () => {
    refSelectedID.current = selected.ID;
    setLoading(true);
    Promise.all([
      piecemarkEntryGet(selected.ID),
      piecemarkEntryPiecemarkInfo(selected.PiecemarkID),
      piecemarkEntryIDInfo(selected.IdfileID),
    ])
      .then((res) => {
        const RES = {
          PiecemarkEntry: noNullValues(res[0]),
          PiecemarkInfo: noNullValues(res[1]),
          IDInfo: noNullValues(res[2]),
        };
        setCommonData(RES);
        reset(RES);
      })
      .catch((e) => {
        refToast.current?.show({
          severity: 'error',
          summary: t('sts.txt.error'),
          detail: e.response.data.Message,
          life: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isNew) {
      setActiveIndex(0);
      reset(PIECEMARK_EMPTY);
    } else {
      reset(commonData);
    }
  }, [isNew]);

  useEffect(() => {
    reset(commonData);
  }, [isEdit]);

  const createNew = async (data) => {
    try {
      setIsBusy(true);
      const { Entries } = await piecemarkEntryCreate(
        noSpaceOnStart(removeEmptyParams({ ...data.PiecemarkEntry, JobID: job.ID })),
      );
      created(Entries);
      confirmDialog({
        closable: false,
        message: t('sts.txt.piecemark.created'),
        header: t('sts.txt.piecemark.created'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const createNewAdd = async (data) => {
    try {
      await createNew(data);
      reset(PIECEMARK_EMPTY);
      setIsNew(true);
      setSelected(null);
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    }
  };

  const tabsMapUpdateRequests = {
    PiecemarkEntry: {
      id: selected?.ID,
      req: piecemarkEntryUpdate,
    },
    PiecemarkInfo: {
      id: selected?.PiecemarkID,
      req: piecemarkEntryPiecemarkInfoUpdate,
    },
    IDInfo: {
      id: selected?.IdfileID,
      req: piecemarkEntryIDInfoUpdate,
    },
  };

  const update = async (data) => {
    try {
      setIsBusy(true);
      await Promise.all(
        Object.keys(dirtyFields).map((key) => {
          const DATA = Object.keys(data[key]).reduce(
            (acc, fieldKey) => ({ ...acc, [fieldKey]: data[key][fieldKey] }),
            {},
          );
          return tabsMapUpdateRequests[key].req(
            tabsMapUpdateRequests[key].id,
            noEmptyStringValues(DATA),
          );
        }),
      );
      reset(data);
      updated(data);
      setIsEdit(false);
      confirmDialog({
        closable: false,
        message: t('sts.txt.piecemark.updated'),
        header: t('sts.txt.piecemark.updated'),
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-times-circle text-yellow-500',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const deleteRequest = async () => {
    try {
      setIsBusy(true);
      await piecemarkEntryDelete(selected.ID);
      setIsEdit(false);
      deleted(selected.ID);
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const deleteWithoutHistory = () => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.piecemark.delete', {
        0: selected.IDSerialNumber,
      }),
      header: t('sts.txt.piecemark.remove'),
      icon: 'pi pi-exclamation-triangle text-yellow-500',
      rejectClassName: 'p-button-danger',
      acceptLabel: t('sts.btn.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.delete'),
      reject: deleteRequest,
    });
  };

  const deleteWithHistory = () => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.piecemark.delete.history', {
        0: selected.IDSerialNumber,
      }),
      header: t('sts.txt.piecemark.remove'),
      icon: 'pi pi-exclamation-triangle text-yellow-500',
      rejectClassName: 'p-button-danger',
      acceptLabel: t('sts.btn.cancel'),
      acceptClassName: 'p-button-secondary',
      rejectLabel: t('sts.btn.delete'),
      reject: () => {
        setTimeout(() => {
          confirmDialog({
            closable: false,
            message: t('1072'),
            acceptLabel: t('sts.btn.no'),
            acceptClassName: 'p-button-secondary',
            rejectLabel: t('sts.btn.yes'),
            rejectClassName: 'p-button-primary',
            accept: deleteRequest,
            icon: 'pi pi-question-circle text-blue-400',
          });
        }, 100);
      },
    });
  };

  const deletePiecemark = async () => {
    try {
      const { HasTransactions } = await piecemarkEntryDelete(selected.ID, { dry_run: true });
      if (HasTransactions) {
        deleteWithHistory();
      } else {
        deleteWithoutHistory();
      }
    } catch (e) {
      confirmDialog({
        closable: false,
        message: e.response.data.Detail,
        header: e.response.data.Message,
        acceptLabel: t('sts.btn.ok'),
        rejectClassName: 'hidden',
        icon: 'pi pi-info-circle text-green-500',
      });
    }
  };

  return (
    <div className="flex flex-column h-full">
      <div className="flex-auto">
        <TabView
          ref={refTabView}
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
          pt={{
            root: {
              className: 'h-full flex flex-column',
            },
            navcontent: {
              className: 'h-3rem flex align-items-center',
            },
            panelcontainer: {
              className: 'py-2 px-0 flex flex-column flex-auto',
            },
          }}
        >
          <TabPanel header={t('sts.tab.piecemark.entry')} className="h-full">
            <Piecemark
              control={control}
              setValue={setValue}
              loading={loading}
              data={getValues().PiecemarkEntry}
              busy={busy}
              createNew={handleSubmit(createNewAdd)}
              isValid={isValid}
              isDirty={isDirty}
            />
          </TabPanel>
          <TabPanel disabled={!selected} header={t('sts.tab.job.info')} className="h-full">
            <JobInfo control={control} disabled={isNew} loading={loading} />
          </TabPanel>
          <TabPanel
            disabled={!selected || isNew}
            header={t('sts.tab.piecemark.info')}
            className="h-full"
          >
            <PiecemarkInfo control={control} loading={loading} data={getValues().PiecemarkInfo} />
          </TabPanel>
          <TabPanel
            disabled={!selected || isNew}
            header={t('sts.tab.barcode.info')}
            className="h-full"
          >
            <IdInfo control={control} loading={loading} data={getValues().IDInfo} />
          </TabPanel>
        </TabView>
      </div>
      <div className="flex justify-content-end gap-2">
        {isNew ? (
          <>
            <Button
              disabled={!isValid || !isDirty}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(createNew)}
            />
            <Button label={t('sts.btn.cancel')} disabled={busy} size="small" onClick={cancel} />
          </>
        ) : isEdit ? (
          <>
            <Button
              label={t('sts.btn.delete')}
              severity="danger"
              size="small"
              disabled={!Delete}
              loading={busy}
              onClick={deletePiecemark}
            />
            <Button
              disabled={!isValid || !isDirty || !Edit}
              label={t('sts.btn.save')}
              size="small"
              loading={busy}
              onClick={handleSubmit(update)}
            />
            <Button
              label={t('sts.btn.cancel')}
              size="small"
              onClick={() => {
                setIsEdit(false);
                reset();
              }}
            />
          </>
        ) : !selected ? null : (
          <Button
            label={t('sts.btn.edit')}
            size="small"
            severity="secondary"
            onClick={() => setIsEdit(true)}
            disabled={(!Edit && !Delete) || loading}
          />
        )}
        <Button label={t('sts.btn.close')} size="small" onClick={window.close} />
      </div>
    </div>
  );
};

export default InfoBlock;
