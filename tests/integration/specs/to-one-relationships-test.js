var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/to-one-relationships', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_no_linked: {
        data: {
          type: 'posts',
          id: '1',
          attributes: {
            title: 'Rails is Omakase',
          },
          relationships: {
            author: {
              data: {
                type: 'authors',
                id: '2'
              }
            }
          },
          links: {
            self: "/posts/1"
          }
        }
      },
      authors: {
        data: {
          type: 'authors',
          id: '2',
          attributes: {
            name: 'dhh'
          },
          relationships: {
          },
          links: {
            self: "/authors/2"
          }
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

asyncTest('GET /posts/1 with async included resources', function() {
    var models = setModels({
      authorAsync: true
    });
    env = setupStore(models);

    fakeServer.get('/posts/1', responses.posts_no_linked);
    fakeServer.get('/authors/2', responses.authors);

    Em.run(function() {
      env.store.find('post', '1').then(function(record) {
        equal(record.get('id'), '1', 'id is correct');
        equal(record.get('title'), 'Rails is Omakase', 'title is correct');

        record.get('author').then(function(author) {
          equal(author.get('id'), '2', 'author id is correct');
          equal(author.get('name'), 'dhh', 'author name is correct');
          start();
        });
      });
    });
});

asyncTest("GET /posts/1 with sync included resources won't work", function() {
  var models = setModels({
    authorAsync: false
  });
  env = setupStore(models);

  fakeServer.get('/posts/1', responses.posts_no_linked);
  fakeServer.get('/authors/2', responses.authors);

  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      var authorId;
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');

      throws(function() {
        record.get('author').then(function(author) {
          equal(author.get('id'), '2', 'author id is correct');
        });
      });
      start();
    });
  });
});
