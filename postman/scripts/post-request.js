const polyData = pm.environment.get('polyData');
const functionId = pm.environment.get('polyFunctionId');

pm.environment.unset('polyData');
pm.environment.unset('polyFunctionId');

const postRequest = {
  url: `http://localhost:8000/teach/${functionId}`,
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'X-PolyApiKey': 'ab4f62d3421bca3674hfd627'  // default dev key
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      ...polyData,
      response: pm.response.json()
    })
  }
};

pm.sendRequest(postRequest, (error) => {
  if (error) {
    console.log(error);
  }
});
