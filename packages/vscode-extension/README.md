# Poly AI assistant for VS Code

## Extension Settings

Extension settings are configured in the `settings.json` file. You can access it by clicking the gear icon in the lower left corner of the VS Code window.

* `poly.apiBaseUrl`: The base URL for the Poly API. Defaults to `https://api.polyapi.io`.
* `poly.apiKey`: The API key to use when making requests to the Poly API.

## Client library
### Installation
To install Poly API client library run `npm install polyapi` in your project directory.

Run `npx poly generate` to set up your Poly connection (only for the first time) and generate Poly functions.
Whenever you update your Poly functions, run `npx poly generate` again to update your local functions.

### Usage
#### Poly functions
After that you can use your Poly client in your code:
```
import poly from 'polyapi';

const response = await poly.myContext.myFunction('param1', 'param2');
```

#### Error handlers
Poly functions can throw errors. You can catch them with try/catch or you can register an error handler for function path:
```
import poly, {errorHandler} from 'polyapi';

errorHandler.on('myContext.myFunction', (error) => {
  // handle error
});
```
or you can register an error handler for all functions in context:
```
errorHandler.on('myContext', (error) => {
  // handle error
});
```

To remove error handler for function path:
```
errorHandler.off('myContext.myFunction');
```

#### Webhook handlers
Similar to error handlers, you can register handlers for Webhooks:
```
import poly from 'polyapi';

poly.myWebhookContext.paymentReceieved(event => {
  // handle event
});
```

Webhook handlers have their context and function name. To remove a handler call the returned function:
```
const unregister = poly.myWebhookContext.paymentReceieved(event => {
  // handle event
});
...
unregister();
```
