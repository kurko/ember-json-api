var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/multiple-resource-links-test', {
    setup: function() {
        fakeServer = stubServer();

        responses = {
            posts_not_compound: {
                data: [{
                    type: 'posts',
                    id: '1',
                    attributes: {
                      title: 'Rails is Omakase',
                    },
                    relationships: {
                      author: {
                        links: {
                          self: '/posts/1/relationships/author',
                          related: '/posts/1/author'
                        },
                        data: {
                          type: 'authors',
                          id: '2'
                        }
                      }
                    }
                }, {
                    type: 'posts',
                    id: '2',
                    attributes: {
                      title: 'TDD Is Dead lol'
                    },
                    relationships: {
                      author: {
                        links: {
                          self: '/posts/2/relationships/author',
                          related: '/posts/2/author'
                        },
                        data: {
                          type: 'authors',
                          id: '1'
                        }
                      }
                    }
                }]
            },
            post_1_author: {
                data: {
                  type: 'authors',
                  id: '2',
                  attributes: {
                    name: 'dhh'
                  }
                }
            },
            post_2_author: {
                data: {
                    type: 'authors',
                    id: '1',
                    attributes: {
                      name: 'ado'
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

asyncTest('GET /posts/1 calls later GET /posts/1/comments when Posts has async comments', function() {
  var models = setModels({
      authorAsync: true
  });
  env = setupStore(models);

  fakeServer.get('/posts', responses.posts_not_compound);
  fakeServer.get('/posts/1/author', responses.post_1_author);
  fakeServer.get('/posts/2/author', responses.post_2_author);

  Em.run(function() {
      env.store.find('post').then(function(records) {
          equal(records.get('length'), 2, 'there are 2 posts');

           var post1 = records.objectAt(0);
           var post2 = records.objectAt(1);
           var promises = [];

           promises.push(new Ember.RSVP.Promise(function(resolve, reject) { resolve('asdf'); }));
           promises.push(post1.get('author'));
           promises.push(post1.get('author').then(function(author) {
              equal(author.get('name'), 'dhh', 'post1 author');
           }));
           promises.push(post2.get('author').then(function(author) {
               equal(author.get('name'), 'ado', 'post2 author');
           }));

           Ember.RSVP.all(promises).then(start);
      });
  });
});
