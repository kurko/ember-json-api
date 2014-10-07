var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/individual-resource-representations', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      lone_post_in_singular: {
        'post': {
          id: '1',
          title: 'Rails is Omakase'
        }
      },
      lone_post_in_plural: {
        'posts': {
          id: '2',
          title: 'TDD Is Dead lol'
        }
      }
    };

    env = setupStore(setModels());
    env.store.modelFor('post');
    env.store.modelFor('comment');
    env.store.modelFor('author');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('GET /posts/1 with single resource interprets singular root key', function() {
  fakeServer.get('/posts/1', responses.lone_post_in_singular);

  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');
      start();
    });
  });
});

asyncTest('GET /posts/2 with single resource interprets plural root key', function() {
  fakeServer.get('/posts/2', responses.lone_post_in_plural);

  Em.run(function() {
    env.store.find('post', '2').then(function(record) {
      equal(record.get('id'), '2', 'id is correct');
      equal(record.get('title'), 'TDD Is Dead lol', 'title is correct');
      start();
    });
  });
});
