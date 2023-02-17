const {url, method, headers, body} = pm.request;
const postRequest = {
  url: 'http://localhost:8000/teach',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'X-PolyApiKey': 'YOUR_API_KEY'
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      alias: pm.info.requestName,
      url: `${url.protocol}://${url.getRemote()}${url.getPathWithQuery()}`,
      method,
      headers,
      body,
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
