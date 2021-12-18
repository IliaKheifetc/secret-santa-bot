if (process.env.NODE_ENV === 'development') {
  const dotenv = require('dotenv');
  dotenv.config({ path: `${__dirname}/env/.env.dev` });
}
