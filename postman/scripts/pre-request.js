const {description, url, method, headers, body, auth} = pm.request;
const postRequest = {
  url: 'https://staging.polyapi.io/teach',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'X-PolyApiKey': 'ab4f62d3421bca3674hfd627'  // default dev key
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      name: pm.info.requestName,
      description: description?.content || '',
      url: `${url.protocol ? `${url.protocol}://` : ''}${url.getRemote()}${url.getPathWithQuery()}`,
      method,
      headers,
      body,
      auth
    })
  }
};

pm.sendRequest(postRequest, (error, response) => {
  if (error) {
    console.log(error);
  } else {
    pm.environment.set("polyFunctionId", response.json().functionId);
  }
});
