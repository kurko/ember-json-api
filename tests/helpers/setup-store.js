window.setupStore = function(options) {
  var container, registry;
  var env = {};
  options = options || {};

  if (Ember.Registry) {
    registry = env.registry = new Ember.Registry();
    container = env.container = registry.container();
  } else {
    container = env.container = new Ember.Container();
    registry = env.registry = container;
  }

  var adapter = env.adapter = options.adapter || DS.JsonApiAdapter;
  var serializer = env.serializer = options.serializer || DS.JsonApiSerializer;

  delete options.adapter;
  delete options.serializer;

  for (var prop in options) {
    registry.register('model:' + Ember.String.dasherize(prop), options[prop]);
  }

  registry.register('adapter:-custom', adapter);
  registry.register('store:main', DS.Store.extend({
    adapter: '-custom'
  }));

  registry.register('serializer:application', serializer);

  registry.injection('serializer', 'store', 'store:main');

  env.serializer = container.lookup('serializer:application');
  env.store = container.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
};
