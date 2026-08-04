/**
 * Standardized API error extraction utility.
 * Replaces the `eslint-disable @typescript-eslint/no-explicit-any` pattern
 * with a properly typed error handler.
 */

interface ApiErrorResponse {
  data?: {
    message?: string;
    errorCode?: string;
  };
  errorCode?: string;
  message?: string;
}

export function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const err = error as ApiErrorResponse & {
    data?: { errorCode?: string };
  };

  return err.data?.errorCode || err.errorCode;
}

/**
 * Extracts a human-readable error message from RTK Query / fetch errors.
 * RTK Query mutations throw objects with `data` property when the server responds.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again.",
): string {
  if (!error) return fallback;

  if (typeof error === "object" && error !== null) {
    const err = error as ApiErrorResponse & {
      status?: string | number;
      error?: string;
      data?: { message?: string };
    };

    if (err.data?.message) return err.data.message;
    if (typeof err.error === "string" && err.error) return err.error;
    if (err.message && err.message !== "Rejected") return err.message;
  }

  if (typeof error === "string") return error;

  return fallback;
}
