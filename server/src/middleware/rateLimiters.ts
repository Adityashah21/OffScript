import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

export const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many order requests from this IP. Please wait before trying again.",
    },
  },
});

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many contact messages sent. Please wait a few minutes before trying again.",
    },
  },
});

export const newsletterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many newsletter subscription requests from this IP.",
    },
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many login attempts. Please try again after 15 minutes.",
    },
  },
});
