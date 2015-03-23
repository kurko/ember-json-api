var get = Ember.get, set = Ember.set;
var models, env;
var responses, fakeServer;

module('integration/specs/deserializing-errors', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      post_errors: {
        errors: [
          {
            code: "blank",
            title: "First Name cannot be blank",
            paths: ["/first-name"]
          }
        ]
      }
    };

    models = setModels();
    env = setupStore(models);
    env.store.modelFor('post');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest("PUT /posts/1 returns errors", function() {
  var request = {
    posts: {
      title: '',
      postSummary: null,
      links: {
        comments: []
      }
    }
  };

  fakeServer.post('/posts', request, responses.post_errors);

  Em.run(function() {
    env.store.createRecord(models.post, { title: '' }).save().then(function(record) {
      equal(record.get('errors'), {title: ['blank']});
      start();
    });
  });
});
