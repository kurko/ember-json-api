var get = Ember.get, set = Ember.set;
var models, env;
var responses, fakeServer;

module('integration/specs/updating-an-individual-resource', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      post: {
        posts: {
          id: '1',
          title: 'Rails is Omakase'
        }
      },
      postAfterUpdate: {
        post: {
          id: '1',
          title: 'TDD Is Dead lol',
          postSummary: 'summary'
        }
      }
    };

    models = setModels();
    env = setupStore(models);
    env.store.modelFor('post');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest("PUT /posts/1 won't push an array", function() {
  var request = {
    posts: {
      id: '1',
      title: 'TDD Is Dead lol',
      postSummary: null,
      links: {
        comments: []
      }
    }
  };

  fakeServer.get('/posts/1', responses.post);
  fakeServer.put('/posts/1', request, responses.postAfterUpdate);

  Em.run(function() {
    env.store.find('post', '1').then(function(post) {
      equal(post.get('title'), 'Rails is Omakase', 'title is correct');
      post.set('title', 'TDD Is Dead lol');
      post.save().then(function(record) {
        equal(record.get('id'), '1', 'id is correct');
        equal(record.get('title'), 'TDD Is Dead lol', 'title is correct');
        equal(record.get('postSummary'), 'summary', 'summary is correct');

        start();
      });
    });
  });
});
