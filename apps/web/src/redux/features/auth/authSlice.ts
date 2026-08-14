import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "./auth.types";

const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return { user: null };
  }

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
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User }>,
    ) => {
      const { user } = action.payload;
      state.user = user;
      if (typeof window !== "undefined") {
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
