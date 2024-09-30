import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment/moment';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DataTable } from 'primereact/datatable';
import { confirmDialog } from 'primereact/confirmdialog';
import { Column } from 'primereact/column';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

import { employeeDeleteLogins, employeeGetLogins } from 'api';
import { DEFAULT_ROW_HEIGHT } from 'const';

const LoginAccounts = ({ personID, isEdit }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    init();
  }, [personID]);

  const init = async () => {
    setLoading(true);
    try {
      const { Entries } = await employeeGetLogins(personID);
      setAccounts(Entries.sort((a, b) => (a.UserName < b.UserName ? -1 : 1)));
    } finally {
      setLoading(false);
    }
  };

  const deleteAccounts = async () => {
    setLoading(true);
    try {
      const { CantDisableAllAccounts, Entries } = await employeeDeleteLogins(personID);
      setAccounts(Entries);
      if (CantDisableAllAccounts) {
        const CORP = Entries.some(({ IsCorpUser, Active }) => IsCorpUser && Active);
        const CURRENT = Entries.some(({ IsCurrentUser, Active }) => IsCurrentUser && Active);
        if (CORP) {
          confirmDialog({
            closable: false,
            message: t('sts.txt.delete.account.corp.name', { 0: CORP.UserName }),
            header: '',
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-times-circle text-yellow-500',
          });
        }
        if (CURRENT) {
          confirmDialog({
            closable: false,
            message: t('977'),
            header: '977',
            acceptLabel: t('sts.btn.ok'),
            rejectClassName: 'hidden',
            icon: 'pi pi-times-circle text-yellow-500',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const hasActiveItem = accounts.find(({ Active }) => Active);

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
              <DataTable
                removableSort
                loading={loading}
                virtualScrollerOptions={{
                  itemSize: DEFAULT_ROW_HEIGHT,
                }}
                scrollHeight={`${300}px`}
                scrollable
                value={accounts}
                resizableColumns
                columnResizeMode="expand"
                reorderableColumns
                showGridlines
                size="small"
                onColReorder={() => {}}
              >
                <Column
                  headerTooltip={t('sts.label.active')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="Login"
                  sortable
                  header={t('sts.label.active')}
                  body={(data) => <Checkbox disabled checked={data.Active} />}
                ></Column>
                <Column
                  headerTooltip={t('sts.label.login.name')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="UserName"
                  sortable
                  header={t('sts.label.login.name')}
                ></Column>
                <Column
                  headerTooltip={t('table.associations.association_name')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="AssociationName"
                  sortable
                  header={t('table.associations.association_name')}
                ></Column>
                <Column
                  headerTooltip={t('table.employee.employee_number')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="EmployeeNumber"
                  sortable
                  header={t('table.employee.employee_number')}
                ></Column>
                <Column
                  headerTooltip={t('sts.col.label.address.type')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="Description"
                  sortable
                  header={t('sts.col.label.address.type')}
                ></Column>
                <Column
                  headerTooltip={t('sts.label.last.login')}
                  headerTooltipOptions={{ position: 'top' }}
                  field="LastLogin"
                  sortable
                  header={t('sts.label.last.login')}
                  body={({ LastLogin }) =>
                    !LastLogin
                      ? null
                      : `${moment(LastLogin).format('l')} ${moment(LastLogin).format('LT')}`
                  }
                ></Column>
              </DataTable>
            </ScrollPanel>
          )}
        </AutoSizer>
        <Button
          disabled={!hasActiveItem || !isEdit}
          label={t('sts.btn.disconnect.from.user')}
          loading={loading}
          onClick={deleteAccounts}
        />
      </div>
    </div>
  );
};

export default LoginAccounts;
