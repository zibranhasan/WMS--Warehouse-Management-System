import { ApiError, ErrorSource } from "./api-error";

const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL environment variable is missing. Please check frontend/.env.local."
    );
  }
  return baseUrl.replace(/\/+$/, "");
};

export type QueryParamValue =
  | string
  | number
  | boolean
  | (string | number | boolean)[]
  | undefined
  | null;

export type QueryParams = Record<string, QueryParamValue>;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: QueryParams;
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const {
    params,
    body,
    headers: customHeaders,
    method = "GET",
    ...customConfig
  } = options;

  let url = `${baseUrl}/${endpoint.replace(/^\/+/, "")}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) {
            searchParams.append(key, String(v));
          }
        });
      } else {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers = new Headers(customHeaders);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let requestBody: BodyInit | undefined = undefined;

  if (body !== undefined && body !== null) {
    if (isFormData) {
      requestBody = body as FormData;
    } else if (typeof body === "string") {
      requestBody = body;
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    } else {
      requestBody = JSON.stringify(body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: requestBody,
    ...customConfig,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Network error occurred";
    throw new ApiError(0, message);
  }

  let responseData: unknown = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let errorSources: ErrorSource[] | undefined = undefined;

    if (responseData && typeof responseData === "object") {
      const errorObj = responseData as Record<string, unknown>;
      if (
        typeof errorObj.message === "string" &&
        errorObj.message.trim() !== ""
      ) {
        errorMessage = errorObj.message;
      }
      if (Array.isArray(errorObj.errorSources)) {
        errorSources = errorObj.errorSources.filter(
          (src): src is ErrorSource =>
            typeof src === "object" &&
            src !== null &&
            typeof (src as Record<string, unknown>).path === "string" &&
            typeof (src as Record<string, unknown>).message === "string"
        );
      }
    }

    throw new ApiError(response.status, errorMessage, errorSources);
  }

  return responseData as T;
}

apiClient.get = <T>(
  endpoint: string,
  options?: Omit<RequestOptions, "method" | "body">
) => apiClient<T>(endpoint, { ...options, method: "GET" });

apiClient.post = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
) => apiClient<T>(endpoint, { ...options, method: "POST", body });

apiClient.put = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
) => apiClient<T>(endpoint, { ...options, method: "PUT", body });

apiClient.patch = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
) => apiClient<T>(endpoint, { ...options, method: "PATCH", body });

apiClient.delete = <T>(
  endpoint: string,
  options?: Omit<RequestOptions, "method" | "body">
) => apiClient<T>(endpoint, { ...options, method: "DELETE" });
