export const errorHandler = (err, req, res, next) => {
    if (!err) return next();
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
};
