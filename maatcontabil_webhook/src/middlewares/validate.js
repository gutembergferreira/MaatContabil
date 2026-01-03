export const validate = (schema) => (req, res, next) => {
    if (!schema) return next();
    const errors = [];
    if (schema.required) {
        for (const field of schema.required) {
            if (req.body?.[field] === undefined || req.body?.[field] === null || req.body?.[field] === '') {
                errors.push(`${field} is required`);
            }
        }
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    return next();
};
