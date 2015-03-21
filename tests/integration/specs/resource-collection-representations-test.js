var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/resource-collection-representations', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_list: {
        data: [{
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase'
        }, {
          type: 'posts',
          id: '2',
          title: 'Ember.js Handlebars'
        }]
      },
      empty_list: {
        data: []
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

asyncTest('GET /posts', function() {
  fakeServer.get('/posts', responses.posts_list);

  env.store.find('post').then(function(record) {
    var post1 = record.get("firstObject"),
        post2 = record.get("lastObject");

    equal(record.get('length'), 2, 'length is correct');

    equal(post1.get('id'), '1', 'id is correct');
    equal(post1.get('title'), 'Rails is Omakase', 'title is correct');

    equal(post2.get('id'), '2', 'id is correct');
    equal(post2.get('title'), 'Ember.js Handlebars', 'title is correct');
    start();
  });
});

asyncTest('GET empty /posts', function() {
  fakeServer.get('/posts', responses.empty_list);

  env.store.find('post').then(function(record) {
    equal(record.get('length'), 0, 'length is correct');
    start();
  });
});
