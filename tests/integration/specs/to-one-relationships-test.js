var get = Ember.get, set = Ember.set;
var env;
var responses, pretender;

module('integration/specs/to-one-relationships', {
  setup: function() {

    responses = {
      different_type: {
        'posts': {
          id: '1',
          title: 'Rails is Omakase',
          links: {
            'author': '2'
          }
        },
        'linked': {
          'authors': [{
            'id': '2',
            'name': 'dhh'
          }]
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

asyncTest('GET /posts/1 returns linked resources', function() {
  pretender = stubResponse('get', '/posts/1', responses.different_type);

  env.store.find('post', '1').then(function(record) {
    var author;
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');

    author = record.get('author');
    equal(author.get('name'), 'dhh', 'author name is correct');
    start();
  });
});
