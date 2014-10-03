import Ember from 'ember';
import DS from 'ember-data';
import JsonApiAdapter from 'ember-json-api/adapters/json-api';
import JsonApiSerializer from 'ember-json-api/serializers/json-api';

export default function(options) {
  var env = {};
  options = options || {};

  var container = env.container = new Ember.Container();

  var adapter = env.adapter = options.adapter || JsonApiAdapter;
  var serializer = env.serializer = options.serializer || JsonApiSerializer;

  delete options.adapter;
  delete options.serializer;

  for (var prop in options) {
    container.register('model:' + prop, options[prop]);
  }

  container.register('store:main', DS.Store.extend({
    adapter: adapter
  }));

  container.register('serializer:application', serializer);

  container.injection('serializer', 'store', 'store:main');

  env.serializer = container.lookup('serializer:application');
  env.store = container.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
}
