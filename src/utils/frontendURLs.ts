import { env } from "@/config/env.config";

const frontendBaseURL = env.FRONTEND_URL || ""; // Fallback if not set

const rawFrontendURLs = {
  employee: {
    login: "/login",
    leaveDetails: (leaveId: string) => `/dashboard/employee/leave/${leaveId}`,
    profile: "/dashboard/employee/profile",
  },
  client: {
    login: "/client/login",
    dashboard: "/dashboard/client",
    leaveDetails: (leaveId: string) => `/dashboard/client/leave/${leaveId}`,
  },
  public: {
    home: "/",
  },
};

function appendBaseURL(urls: any, baseURL: string) {
  const result: any = {};

  for (const key in urls) {
    const value = urls[key];

    if (typeof value === "object") {
      // Recursively handle nested objects
      result[key] = appendBaseURL(value, baseURL);
    } else if (typeof value === "function") {
      // Handle functions (like leaveDetails)
      result[key] = (...args: string[]) => `${baseURL}${value(...args)}`;
    } else {
      // Handle simple string routes
      result[key] = `${baseURL}${value}`;
    }
  }

  return result;
}

const frontendURLs = appendBaseURL(rawFrontendURLs, frontendBaseURL);

export default frontendURLs;
