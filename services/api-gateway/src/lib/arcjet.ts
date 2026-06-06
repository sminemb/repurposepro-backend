import arcjet, { detectBot, fixedWindow, shield } from "@arcjet/node";

import { env } from "../config/env.js";

const commonSecurityRules = [
  shield({ mode: "LIVE" }),
  detectBot({
    mode: "LIVE",
    allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
  }),
];

const createArcjetClient = (rules: Parameters<typeof arcjet>[0]["rules"]) => {
  if (env.arcjetKey === undefined) {
    return undefined;
  }

  return arcjet({
    key: env.arcjetKey,
    characteristics: ["ip.src"],
    rules,
  });
};

export const isArcjetConfigured = env.arcjetKey !== undefined;

export const generalApiArcjet = createArcjetClient([
  ...commonSecurityRules,
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 100,
  }),
]);

export const authArcjet = createArcjetClient([
  ...commonSecurityRules,
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  }),
]);

export const uploadArcjet = createArcjetClient([
  ...commonSecurityRules,
  fixedWindow({
    mode: "LIVE",
    window: "1h",
    max: 5,
  }),
]);

export const processingArcjet = createArcjetClient([
  ...commonSecurityRules,
  fixedWindow({
    mode: "LIVE",
    window: "1h",
    max: 3,
  }),
]);
