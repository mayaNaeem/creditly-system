"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, segment = 'body') => {
    return (req, _res, next) => {
        const parsed = schema.parse(req[segment]);
        req[segment] = parsed;
        next();
    };
};
exports.validate = validate;
