import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const accessToken = localStorage.getItem("access_token");

  // Check if token exists and is not expired (basic check)
  const isAuthenticated = () => {
    if (!accessToken) return false;

    try {
      // Decode JWT token to check expiration (basic implementation)
      const tokenParts = accessToken.split(".");
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem("access_token");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      localStorage.removeItem("access_token");
      return false;
    }
  };

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
