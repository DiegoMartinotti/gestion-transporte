class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
    }
}

class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        this.status = 401;
    }
}

module.exports = {
    ValidationError,
    NotFoundError,
    AuthenticationError
};
