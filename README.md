# ember-json-api

![](https://travis-ci.org/kurko/ember-json-api.svg?branch=master)

This is a [JSON API](http://jsonapi.org) adapter for [Ember Data](http://github.com/emberjs/data) 1.0 beta 16.1, that extends the built-in REST adapter. Please note that Ember Data and JSON API are both works in progress, use with caution.

**Important:** this is under heavy development. For the latest stable release,
check the latest tag.

This follows [JSONAPI v1.0 rc3](https://github.com/json-api/json-api/blob/827ba3c1130408fdb406d9faab645b0db7dd4fe4/index.md), with a primary `data` root, resources linked with `related` property, side loaded data in an `included` array at the root, and consistent linkage with a `linkage` property for a linked resource.

### Specification coverage

To see details on how much of the JSONAPI.org spec this adapter covers, read the
tests under `tests/integration/specs/`. Each field tests one section of the
standard.

### Usage

To install:

```
npm install --save-dev ember-json-api
```

Next, define the adapter and serializer:

```js
// app/adapters/application.js
import JsonApiAdapter from 'ember-json-api/json-api-adapter';
export default JsonApiAdapter;

// app/serializers/application.js
import JsonApiSerializer from 'ember-json-api/json-api-serializer';
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

This code abides to the MIT license: http://opensource.org/licenses/MIT
