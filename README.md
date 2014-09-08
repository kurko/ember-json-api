# ember-json-api

This is a [JSON API](http://jsonapi.org) adapter for [Ember Data](http://github.com/emberjs/data)
1.0 beta 3, that extends the built-in REST adapter. Please note that Ember Data
and JSON API are both works in progress, use with caution.

### Download

- [json_api_adapter.js](http://raw.github.com/kurko/ember-json-api/master/dist/json_api_adapter.js) (5.0 kb)
- [json_api_adapter.min.js](http://raw.github.com/kurko/ember-json-api/master/dist/json_api_adapter.min.js) (2.3 kb)

### Usage

```js
App.ApplicationAdapter = DS.JsonApiAdapter;
```

### Tests & Build

Install `grunt-cli`: `npm install -g grunt-cli`, then run:

    $ npm install && grunt

The output files go in the `dist` folder.

### Issues

- This adapter has preliminary support for URL-style JSON API. It currently
only serializes one route per type, so if you have multiple ways to get a
resource, it will not work as expected.

### Thanks

A huge thanks goes to [Dali Zheng](https://github.com/daliwali) who initially 
maintained the adapter.

### License

This code abides to the MIT license. http://opensource.org/licenses/MIT
