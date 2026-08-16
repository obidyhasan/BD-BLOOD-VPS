import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "./features/auth/authSlice";

// Import all API slices to inject endpoints into baseApi
import "./features/auth/authApi";
import "./features/donors/donorsApi";
import "./features/blogs/blogsApi";
import "./features/bloodRequests/bloodRequestsApi";
import "./features/bloodDonations/bloodDonationsApi";
import "./features/organizations/organizationsApi";
import "./features/posts/postsApi";
import "./features/events/eventsApi";
import "./features/gallery/galleryApi";
import "./features/faqs/faqsApi";
import "./features/notifications/notificationsApi";
import "./features/medicalInstitutions/medicalInstitutionsApi";
import "./features/analytics/analyticsApi";
import "./features/policies/policiesApi";
import "./features/blood/bloodApi";
import "./features/location/locationApi";
import "./features/inventory/inventoryApi";
import "./features/reports/reportsApi";
import "./features/bloodRequestNotifications/bloodRequestNotificationsApi";
import "./features/contact/contactApi";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
