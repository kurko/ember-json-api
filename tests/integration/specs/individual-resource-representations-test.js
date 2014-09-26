var get = Ember.get, set = Ember.set;
var env;
var responses, pretender;

module('integration/specs/individual-resource-representations', {
  setup: function() {

    responses = {
      lone_post: {
        'posts': {
          id: '1',
          title: 'Rails is Omakase'
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
    shutdownPretender();
  }
});

asyncTest('GET /posts/1 with single resource', function() {
  pretender = stubResponse('get', '/posts/1', responses.lone_post);

  env.store.find('post', '1').then(function(record) {
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');
    start();
  });
});
