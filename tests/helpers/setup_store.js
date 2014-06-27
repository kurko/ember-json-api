window.setupStore = function(options) {
  var env = {};
  options = options || {};

  var container = env.container = new Ember.Container();

  var adapter = env.adapter = options.adapter || DS.JsonApiAdapter;
  var serializer = env.serializer = options.serializer || DS.JsonApiSerializer;

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
};
