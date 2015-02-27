var get = Ember.get, set = Ember.set;
var models, env;
var responses, fakeServer;

module('integration/specs/creating-an-individual-resource', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      post: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          post_summary: 'summary'
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

asyncTest("POST /posts/1 won't push an array", function() {
  var request = {
    data: {
      type: 'posts',
      title: 'Rails is Omakase',
      postSummary: null,
      links: {
        comments: {
          type: 'comments',
          ids: []
        }
      }
    }
  };

  fakeServer.post('/posts', request, responses.post);

  Em.run(function() {
    var post = env.store.createRecord(models.post, { title: 'Rails is Omakase' });

    post.save().then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');
      equal(record.get('postSummary'), 'summary', 'summary is correct');

      start();
    });
  });
});
