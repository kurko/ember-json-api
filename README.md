# ember-json-api

This is a [JSON API](http://jsonapi.org) adapter for [Ember Data](http://github.com/emberjs/data)
1.0 beta 8, that extends the built-in REST adapter. Please note that Ember Data
and JSON API are both works in progress, use with caution.

**Important:** this is under heavy development. For the lastest stable release,
use the `stable-*` branch.

### Usage

Considering you're using Ember CLI, add this to your `bower.json` file:

```json
{
  "dependencies": {
    "ember-json-api": "http://raw.github.com/kurko/ember-json-api/master/dist/ember-json-api.js"
  }
}
```

Then define the following in your `Brocfile.js`:

```js
app.import('bower_components/ember-json-api/index.js', {
  exports: {
    'json_api_adapter': [ 'default' ],
    'json_api_serializer': [ 'default' ]
  }
});
```

Next, define the adapter and serializer:

```js
// app/adapters/application.js
import { default as JsonApiAdapter } from 'json_api_adapter';
export default JsonApiAdapter;

// app/serializers/application.js
import { default as JsonApiSerializer } from 'json_api_serializer';
export default JsonApiSerializer;
```

### Tests & Build

First, install depdendencies with `npm install && bower install`. Then run
`npm run serve` and visit `http://localhost:4200/tests`.

If you prefer, use `npm run test` in your terminal, which will run tests
without a browser. You need to have PhantomJS installed.

To build a new version, just run `npm run build`. The build will be
available in the `dist/` directory.

### Issues

- This adapter has preliminary support for URL-style JSON API. It currently
only serializes one route per type, so if you have multiple ways to get a
resource, it will not work as expected.

### Thanks

A huge thanks goes to [Dali Zheng](https://github.com/daliwali) who initially
maintained the adapter.

### License

This code abides to the MIT license. http://opensource.org/licenses/MIT
