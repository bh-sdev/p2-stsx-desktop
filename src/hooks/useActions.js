import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';

import Actions from 'store/actions';

const useActions = () => {
  const dispatch = useDispatch();
  return bindActionCreators(Actions, dispatch);
};

export default useActions;
