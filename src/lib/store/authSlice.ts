import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  credits: number;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
};

// Async thunk to fetch session from /api/auth/me only once on startup
export const fetchSession = createAsyncThunk(
  'auth/fetchSession',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    if (state.auth.initialized && state.auth.user) {
      return state.auth.user;
    }
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated && data.user) {
      return data.user as AuthUser;
    }
    return null;
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.initialized = true;
      state.loading = false;
    },
    setCredits: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.credits = action.payload;
      }
    },
    addCredits: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.credits += action.payload;
      }
    },
    deductCredits: (state, action: PayloadAction<number | undefined>) => {
      const amount = action.payload ?? 1;
      if (state.user && state.user.credits >= amount) {
        state.user.credits -= amount;
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.loading = false;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload;
        }
      })
      .addCase(fetchSession.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      });
  },
});

export const { setUser, setCredits, addCredits, deductCredits, logoutUser } = authSlice.actions;
export default authSlice.reducer;
