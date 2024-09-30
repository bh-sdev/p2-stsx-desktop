import { useTranslation } from 'react-i18next';
import { confirmDialog } from 'primereact/confirmdialog';

const useShowNotAvailable = () => {
  const { t } = useTranslation();
  const showNotAvailable = () => {
    confirmDialog({
      closable: false,
      message: t('sts.txt.error.feature'),
      header: t('sts.txt.error.feature'),
      acceptLabel: t('sts.btn.ok'),
      rejectClassName: 'hidden',
      icon: 'pi pi-info-circle text-red-500',
    });
  };
  return { showNotAvailable };
};

export default useShowNotAvailable;
