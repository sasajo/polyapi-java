## Publishing
Make sure you have set your npm registry in .npmrc file.

Run `npm publish` to publish to the repository.

## Usage
Make sure you have set your npm registry in .npmrc file.

Install the package with `npm install polyapi`.

Run `npx poly generate` to setup your Poly connection (only for the first time) and generate Poly functions.
Whenever you update your Poly functions, run `npx poly generate` again to update your local functions.

### Using Poly functions
After that you can use your Poly client in your code:
```
import poly from 'polyapi';

const response = await poly.myContext.myFunction('param1', 'param2');
```

### Using error handler
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

### Using Webhook handlers
Similar to error handlers, you can register handlers for Webhooks:
```
import poly from 'polyapi';

poly.myWebhookContext.paymentReceieved(event => {
  // handle event
});
```

Webhook handlers have their context and function alias. To remove a handler call the returned function:
```
const unregister = poly.myWebhookContext.paymentReceieved(event => {
  // handle event
});
...
unregister();
```
