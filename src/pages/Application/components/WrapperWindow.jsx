import { classNames } from 'primereact/utils';

import useWindowControl from 'hooks/useWindowControl';

const WrapperWindow = ({ children }) => {
  const { blockedAll } = useWindowControl(window.name, false);
  return (
    <div
      className={classNames({
        'w-full': true,
        'h-full': true,
        'p-disabled': blockedAll,
      })}
    >
      {children}
    </div>
  );
};

export default WrapperWindow;
