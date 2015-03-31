var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/to-many-polymorphic', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      data: {
        type: 'owners',
        id: '1',
        name: 'Luke',
        links: {
          pets: {
            linkage: [
              {
                type: 'cats',
                id: 'cat_1'
              },
              {
                type: 'dogs',
                id: 'dog_2'
              }
            ]
          }
        }
      },
      included: [
        {
          type: 'cats',
          id: 'cat_1',
          whiskers: 4,
          paws: 3
        },
        {
          type: 'dogs',
          id: 'dog_2',
          spots: 7,
          paws: 5
        }
      ]
    };

    env = setupStore(setPolymorphicModels());
    env.store.modelFor('owner');
    env.store.modelFor('pet');
    env.store.modelFor('dog');
    env.store.modelFor('cat');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('GET /owners/1 with sync included resources', function() {
  var models = setPolymorphicModels();
  env = setupStore(models);

  fakeServer.get('/owners/1', responses);

  Em.run(function() {
    env.store.find('owner', '1').then(function(record) {

      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('name'), 'Luke', 'name is correct');

      var cat = record.get('pets.firstObject');
      var dog = record.get('pets.lastObject');

      equal(cat.get('paws'), 3, 'common prop from base class correct on cat');
      equal(dog.get('paws'), 5, 'common prop from base class correct on dog');
      equal(cat.get('whiskers'), 4, 'cat has correct whiskers (cat-only prop)');
      equal(dog.get('spots'), 7, 'dog has correct spots (dog-only prop)');

      start();
    });
  });
});
