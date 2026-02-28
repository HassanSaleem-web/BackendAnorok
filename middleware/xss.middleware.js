// middleware/xss.middleware.js
const { JSDOM } = require("jsdom");
const DOMPurify = require("dompurify")(new JSDOM("").window);

const clean = (data) => {
    if (typeof data === "string") {
        // Escape HTML logic natively
        return DOMPurify.sanitize(data.trim());
    }
    if (Array.isArray(data)) {
        return data.map((item) => clean(item));
    }
    if (typeof data === "object" && data !== null) {
        for (let key in data) {
            if (Object.hasOwn(data, key)) {
                data[key] = clean(data[key]);
            }
        }
        return data;
    }
    return data;
};

const xssMiddleware = (req, res, next) => {
    if (req.body) req.body = clean(req.body);
    if (req.query) {
        const cleanQuery = clean({ ...req.query });
        req.query = cleanQuery;
    }
    if (req.params) {
        const cleanParams = clean({ ...req.params });
        req.params = cleanParams;
    }

    next();
};

module.exports = xssMiddleware;
