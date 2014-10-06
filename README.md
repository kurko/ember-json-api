# ember-json-api

This [Ember CLI](http://github.com/stefanpenner/ember-cli) addon provides a [JSON API](http://jsonapi.org)
adapter for [Ember Data](http://github.com/emberjs/data)
1.0 beta 8, that extends the built-in REST adapter. Please note that Ember Data
and JSON API are both works in progress, use with caution.

**Important:** this is under heavy development. For the latest stable release,
use the `stable-*` branch.

### Installation

```
npm install ember-json-api --save-dev
```

### Usage


```js
// app/adapters/application.js
import JsonApiAdapter from 'ember-json-api/adapters/json-api';
export default JsonApiAdapter;

// app/serializers/application.js
import JsonApiSerializer from 'ember-json-api/serializers/json-api';
export default JsonApiSerializer;
```

### Tests & Build

First, install dependencies with `npm install && bower install`. Then run
`ember serve` and visit `http://localhost:4200/tests`.

If you prefer, use `npm run test` in your terminal, which will run tests
without a browser. You need to have PhantomJS installed.

### Issues

- This adapter has preliminary support for URL-style JSON API. It currently
only serializes one route per type, so if you have multiple ways to get a
resource, it will not work as expected.

### Thanks

A huge thanks goes to [Dali Zheng](https://github.com/daliwali) who initially
maintained the adapter.

### License

This code abides to the MIT license. http://opensource.org/licenses/MIT
