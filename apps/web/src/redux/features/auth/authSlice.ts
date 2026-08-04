import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "./auth.types";

const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null };
  }

  const token = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");

  let parsedUser = null;

  try {
    parsedUser =
      userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch (error) {
    parsedUser = null;
  }

  return {
    user: parsedUser,
    accessToken: token || null,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.accessToken = token;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
