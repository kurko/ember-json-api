var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/null-relationship', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_1: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            'comments': null
          }
        }
      },
      posts_2: {
        data: {
          type: 'posts',
          id: '2',
          title: 'Hello world',
          links: {
            author: null
          }
        }
      }
    };

    env = setupStore(setModels());
    env.store.modelFor('post');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('GET /posts/1', function() {
  var models = setModels({
    authorAsync: true,
    commentAsync: true
  });
  env = setupStore(models);

  fakeServer.get('/posts/1', responses.posts_1);

  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');

      record.get('comments').then(function(comments) {
        equal(comments.get('length'), 0, 'there are 0 comments');
        start();
      });
    });
  });
});

asyncTest('GET /posts/2', function() {
  var models = setModels({
      authorAsync: true
  });
  env = setupStore(models);

  fakeServer.get('/posts/2', responses.posts_2);

  Em.run(function() {
    env.store.find('post', '2').then(function(record) {
      equal(record.get('id'), '2', 'id is correct');
      equal(record.get('title'), 'Hello world', 'title is correct');

      record.get('author').then(function(author) {
        equal(author, null, 'Author is null');
        start();
      });
    });
  });
});
