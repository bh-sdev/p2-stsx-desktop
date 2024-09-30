import { Navigate } from 'react-router-dom';
import { ServiceTokenStorage } from 'services';

const ProtectedRoute = ({ children }) => {
  return ServiceTokenStorage.hasToken() ? children : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
