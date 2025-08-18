import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { authService } from "@/services/auth-service";
import { authStart, authSuccess, authFail } from "@/store/slices/auth-slice";
import { RootState } from "@/store/index";
import { AuthError } from "@/lib/types";

// Module-level gate to avoid duplicate "/users/me" requests across multiple hook instances
let authLoadStarted = false;

export const useAuthUser = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!auth.isAuthenticated && auth.user === null && !authLoadStarted) {
        authLoadStarted = true;
        dispatch(authStart());
        try {
          const user = await authService.getCurrentUser();
          dispatch(authSuccess({ user }));
        } catch (err) {
          const error = err as AuthError;
          dispatch(authFail(error.message || "Not authenticated"));
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [auth.isAuthenticated, auth.user, dispatch]);

  return { ...auth, loading };
};
