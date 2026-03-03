import { useEffect } from "react";
import api from "../lib/axios";
import { useAuth } from "@clerk/clerk-react";

const useAuthReq = () => {
  const { isSignedIn, getToken, isLoaded } = useAuth();

// axios has called 'interceptors' which means you can include something in the headers
// include the token to the request headers

  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      async (config) => {
        if (isSignedIn) {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Cleanup to prevent duplicate interceptors
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [isSignedIn, getToken]);

  return { isSignedIn, isClerkLoaded: isLoaded };
};

export default useAuthReq;