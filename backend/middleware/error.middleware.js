export default (err, req, res, next) => {
  console.error('❌ Error:', err.stack || err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};
