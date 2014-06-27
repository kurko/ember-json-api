var get = Ember.get, set = Ember.set;
var HomePlanet, league, SuperVillain, superVillain, EvilMinion, YellowMinion, DoomsdayDevice, MediocreVillain, env;
module('integration/ember-json-api-adapter - serializer', {
  setup: function() {
    SuperVillain = DS.Model.extend({
      firstName:     DS.attr('string'),
      lastName:      DS.attr('string'),
      homePlanet:    DS.belongsTo('homePlanet'),
      evilMinions:   DS.hasMany('evilMinion')
    });

    HomePlanet = DS.Model.extend({
      name:          DS.attr('string'),
      superVillains: DS.hasMany('superVillain', { async: true })
    });

    EvilMinion = DS.Model.extend({
      superVillain: DS.belongsTo('superVillain'),
      name:         DS.attr('string')
    });

    YellowMinion = EvilMinion.extend();
    DoomsdayDevice = DS.Model.extend({
      name:         DS.attr('string'),
      evilMinion:   DS.belongsTo('evilMinion')
    });

    MediocreVillain = DS.Model.extend({
      name:         DS.attr('string'),
      evilMinions:  DS.hasMany('evilMinion')
    });

    env = setupStore({
      superVillain:   SuperVillain,
      homePlanet:     HomePlanet,
      evilMinion:     EvilMinion,
      yellowMinion:   YellowMinion,
      doomsdayDevice: DoomsdayDevice,
      mediocreVillain: MediocreVillain
    });

    env.store.modelFor('superVillain');
    env.store.modelFor('homePlanet');
    env.store.modelFor('evilMinion');
    env.store.modelFor('yellowMinion');
    env.store.modelFor('doomsdayDevice');
    env.store.modelFor('mediocreVillain');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
  }
});

test('serialize camelcase', function() {
  var tom;

  Ember.run(function() {
    league = env.store.createRecord(HomePlanet, {
      name: 'Villain League',
      id: '123'
    });

    tom = env.store.createRecord(SuperVillain, {
      firstName: 'Tom',
      lastName: 'Dale',
      homePlanet: league
    });
  });

  var json = Ember.run(function(){
    return env.serializer.serialize(tom);
  });

  deepEqual(json, {
    firstName: 'Tom',
    lastName: 'Dale',
    links: {
      homePlanet: get(league, 'id')
    }
  });
});

test('serializeIntoHash', function() {
  var json = {};

  Ember.run(function(){
    league = env.store.createRecord(HomePlanet, {
      name: 'Umber',
      id: '123'
    });

   env.serializer.serializeIntoHash(json, HomePlanet, league);
  });

  deepEqual(json, {
    homePlanet: {
      name: 'Umber'
    }
  });
});

test('serializeIntoHash with decamelized types', function() {
  HomePlanet.typeKey = 'home-planet';
  var json = {};

  Ember.run(function() {
    league = env.store.createRecord(HomePlanet, {
      name: 'Umber',
      id: '123'
    });

    env.serializer.serializeIntoHash(json, HomePlanet, league);
  });

  deepEqual(json, {
    homePlanet: {
      name: 'Umber'
    }
  });
});

test('normalize camelCased', function() {
  var superVillain_hash = {
    firstName: 'Tom',
    lastName: 'Dale',
    links: {
      homePlanet: '123',
      evilMinions: [1,2]
    }
  };

  var json = Ember.run(function() {
    return env.serializer.normalize(SuperVillain, superVillain_hash, 'superVillain');
  });

  deepEqual(json, {
    firstName: 'Tom',
    lastName: 'Dale',
    homePlanet: '123',
    evilMinions: [1,2]
  });
});

test('normalize links camelized', function() {
  var homePlanet = {
    id: '1',
    name: 'Umber',
    links: {
      superVillains: '/api/super_villians/1'
    }
  };

  var json = Ember.run(function() {
    return env.serializer.normalize(HomePlanet, homePlanet, 'homePlanet');
  });

  equal(json.superVillains,  '/api/super_villians/1', 'normalize links');
});

test('extractSingle snake_case', function() {
  env.container.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
    home_planet:   {
      id: '1',
      name: 'Umber',
      links: {
        super_villains: [1]
      }
    },
    super_villains:  [{
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      links: {
        home_planet: '1'
      }
    }]
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  }

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  }

  Ember.run(function() {
    return env.serializer.extractSingle(env.store, HomePlanet, json_hash);
  });

  env.store.find('superVillain', 1).then(function(minion){
    equal(minion.get('firstName'), 'Tom');
  });
});

test('extractSingle camelCase', function() {
  env.container.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
    home_planet:   {
      id: '1',
      name: 'Umber',
      links: {
        super_villains: [1]
      }
    },
    linked: {
      super_villains:  [{
        id: '1',
        firstName: 'Tom',
        lastName: 'Dale',
        links: {
          homePlanet: '1'
        }
      }]
    }
  };

  Ember.run(function() {
    return env.serializer.extractSingle(env.store, HomePlanet, json_hash);
  });

  env.store.find('superVillain', 1).then(function(minion){
    equal(minion.get('firstName'), 'Tom');
  });
});

test('extractArray snake_case', function() {
  env.container.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
      home_planets: [{
        id: '1',
        name: 'Umber',
        links: {
          super_villains: [1]
        }
      }],
      linked: {
        super_villains: [{
          id: '1',
          first_name: 'Tom',
          last_name: 'Dale',
          links: {
            home_planet: '1'
          }
        }]
      }
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  }

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  }

  Ember.run(function() {
    env.serializer.extractArray(env.store, HomePlanet, json_hash);
  });

  env.store.find('superVillain', 1).then(function(minion){
    equal(minion.get('firstName'), 'Tom');
  });
});
// TODO: test something that utilizes the flattening of links in normalize

test('extractArray', function() {
  env.container.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
      home_planets: [{
        id: '1',
        name: 'Umber',
        links: {
          super_villains: [1]
        }
      }],
      linked: {
        super_villains: [{
          id: '1',
          first_name: 'Tom',
          last_name: 'Dale',
          links: {
            home_planet: '1'
          }
        }]
      }
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  }

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  }

  Ember.run(function() {
    env.serializer.extractArray(env.store, HomePlanet, json_hash);
  });

  env.store.find('superVillain', 1).then(function(minion){
    equal(minion.get('firstName'), 'Tom');
  });
});
