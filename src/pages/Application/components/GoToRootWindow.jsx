import STS from 'assets/images/sts.gif';
import { NAME_ROOT_WINDOW } from 'const';
import { useEffect } from 'react';

const GoToRootWindow = ({ trigger }) => {
  useEffect(() => {
    trigger && switchToParent();
  }, [trigger]);

  const switchToParent = () => window?.opener && window.open('', NAME_ROOT_WINDOW).focus();

  return (
    <img
      className="cursor-pointer"
      width={65}
      height={32}
      src={STS}
      alt="STS"
      onClick={switchToParent}
    />
  );
};

export default GoToRootWindow;
