const serverless = require('serverless-http');
const app = require('../index');

// Wrap the existing Express app for serverless environments (Vercel)
module.exports = serverless(app);
