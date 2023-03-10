## Postman
### Setup Pre-request script
Copy content of `pre-request.js` to `Pre-request Script` tab in Postman Collection/Folder/Request.\
Replace `API_KEY` with Poly API key of your user ('ab4f62d3421bca3674hfd627' for default dev user).

### Setup Tests script
Copy content of `post-request.js` to `Tests` tab in Postman Collection/Folder/Request.\
Replace `API_KEY` with Poly API key of your user ('ab4f62d3421bca3674hfd627' for default dev user).

### Run Collection/Folder/Request
Run Collection/Folder/Request in Postman to teach Poly API with about the requests.

### Custom Poly data
You can set function alias, context, description and/or response payload for a specific request, by adding Pre-request Script to the request.
```
pm.environment.set('polyData', {
  functionAlias: 'myFunction',
  description: 'My function description',
  context: 'myContext',
  payload: '$.results[0].geometry.location'
}));
```
`functionAlias`, `context` `description` and `payload` are optional.
`payload` is using [JSONPath format](https://goessner.net/articles/JsonPath/index.html#e2)
