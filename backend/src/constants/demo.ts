// Shared constants for the public "Continue without login" demo account
// (see frontend AuthContext.continueAsDemo, which logs in with these exact
// credentials). Centralized here so the rate limiter exemption and the
// reset job can't drift out of sync with each other.
export const DEMO_EMAIL = "demo@financetracker.dev";
export const DEMO_PASSWORD = "DemoPass123!";
export const DEMO_NAME = "Demo User";