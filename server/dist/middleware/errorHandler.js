import { ZodError } from "zod";
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export function errorHandler(err, _req, res, _next) {
    // Handle AppError
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
        });
        return;
    }
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const details = {};
        for (const issue of err.issues) {
            const field = issue.path.join(".") || "form";
            if (!details[field]) {
                details[field] = issue.message;
            }
        }
        res.status(422).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details,
            },
        });
        return;
    }
    // Handle SyntaxError (e.g. invalid JSON payload)
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
        res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Malformed JSON payload",
            },
        });
        return;
    }
    // Handle generic error
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
        },
    });
}
