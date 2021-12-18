const fetch = require('node-fetch');

const { HASURA_GRAPHQL_API_URL, HASURA_GRAPHQL_ADMIN_SECRET } = process.env;

class ApiSource {
  constructor({ url, headers }) {
    this.url = url;
    this.headers = headers;
  }

  async request({ url = this.url, headers = this.headers, method, data }) {
    console.log('request headers', headers);

    const response = await fetch(url, {
      method,
      body: data ? JSON.stringify(data) : null,
      headers,
    });

    return await response.json();
  }

  get({ url, headers }) {
    return this.request({ url, headers, method: 'GET' });
  }

  post({ url, headers, data }) {
    return this.request({ url, headers, method: 'POST', data });
  }

  async graphql({ query, variables, operationName, errorMessage = 'Error: ' }) {
    try {
      const response = await this.post({
        data: {
          query,
          variables,
          operationName,
        },
      });

      console.log('response', response);
      if (response.errors) {
        console.error(errorMessage, response.errors);
        console.error('Extensions: ', response.errors?.extensions);
      }

      return response;
    } catch (err) {
      console.error(errorMessage, err);
      return null;
    }
  }
}

module.exports = new ApiSource({
  url: HASURA_GRAPHQL_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Hasura-Admin-Secret': HASURA_GRAPHQL_ADMIN_SECRET,
  },
});
