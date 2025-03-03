"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = isUser;
// Export a type guard for User type
function isUser(user) {
    return (typeof user === 'object' &&
        user !== null &&
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        typeof user.role === 'string');
}
