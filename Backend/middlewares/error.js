// We are creating a Global Error Handling Middleware in Express.

// We write:
// To handle all application errors in one place and send meaningful error messages to the client.

// We use:
// Whenever any error occurs in the application and next(error) is called.

// It handle:
// Invalid MongoDB Object IDs
// Mongoose Validation Errors
// Duplicate Key Errors (e.g., same email registered twice)
// Invalid JWT Tokens
// Expired JWT Tokens
// Unexpected Server Errors

// Development vs Production
// Development: Shows detailed error information (message + stack trace) to help developers debug.
// Production: Shows only user-friendly messages without exposing sensitive details.

// This middleware acts as the central error manager of the application, catching all errors and sending appropriate responses based on the environment. 

// Think of it as the hospital's emergency department — no matter what type of emergency comes in, it decides how to handle it and what information should be shared with the patient.

const errorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Wrong MongoDB ID error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new errorHandler(message, 400);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate ${field} entered`;
        err = new errorHandler(message, 400);
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = "JSON Web Token is invalid. Try again.";
        err = new errorHandler(message, 400);
    }

    // JWT expired error
    if (err.name === "TokenExpiredError") {
        const message = "JSON Web Token has expired. Try again.";
        err = new errorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};