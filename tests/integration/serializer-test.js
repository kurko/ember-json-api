var get = Ember.get, set = Ember.set;
var HomePlanet, league, SuperVillain, superVillain, Minion, EvilMinion, YellowMinion, MaleMinion, FemaleMinion, env;
module('integration/ember-json-api-adapter - serializer', {
  setup: function() {
    SuperVillain = DS.Model.extend({
      firstName:     DS.attr('string'),
      lastName:      DS.attr('string'),
      homePlanet:    DS.belongsTo('homePlanet'),
      evilMinions:   DS.hasMany('evilMinion')
    });

    MegaVillain = DS.Model.extend({
      firstName:     DS.attr('string'),
      lastName:      DS.attr('string'),
      minions:   DS.hasMany('blueMinion')
    });

    HomePlanet = DS.Model.extend({
      name:          DS.attr('string'),
      superVillains: DS.hasMany('superVillain', { async: true })
    });

    Minion = DS.Model.extend({
      name:         DS.attr('string')
    });

    EvilMinion = Minion.extend({
      superVillain: DS.belongsTo('superVillain')
    });

    YellowMinion = EvilMinion.extend();
    BlueMinion = DS.Model.extend({
      superVillain: DS.belongsTo('megaVillain')
    });

    MaleMinion = Minion.extend({
      wife: DS.belongsTo('femaleMinion', {inverse: 'husband'}),
      spouse: DS.belongsTo('minion', {polymorphic: true})
    });

    FemaleMinion = Minion.extend({
      husband: DS.belongsTo('maleMinion', {inverse: 'wife'})
    });

    env = setupStore({
      superVillain:   SuperVillain,
      megaVillain:    MegaVillain,
      homePlanet:     HomePlanet,
      minion:         Minion,
      evilMinion:     EvilMinion,
      yellowMinion:   YellowMinion,
      blueMinion:     BlueMinion,
      maleMinion:     MaleMinion,
      femaleMinion:   FemaleMinion
    });

    env.store.modelFor('superVillain');
    env.store.modelFor('homePlanet');
    env.store.modelFor('evilMinion');
    env.store.modelFor('yellowMinion');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
  }
});

test('serialize dasherized', function() {
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
    var snapshot = tom._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    'first-name': 'Tom',
    'last-name': 'Dale',
    links: {
      'evil-minions': {
        linkage: []
      },
      'home-planet': {
        linkage: {
          id: get(league, 'id'),
          type: 'home-planets'
        }
      }
    }
  });
});

test('serialize camelcase', function() {
  var tom;

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.camelize(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.camelize(key);
  };

  env.serializer.keyForSnapshot = function(snapshot) {
    return Ember.String.camelize(snapshot.typeKey);
  };

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
    var snapshot = tom._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    firstName: 'Tom',
    lastName: 'Dale',
    links: {
      evilMinions: {
        linkage: []
      },
      homePlanet: {
        linkage: {
          id: get(league, 'id'),
          type: 'homePlanets'
        }
      }
    }
  });
});

test('serialize into snake_case', function() {
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

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  };

  env.serializer.keyForSnapshot = function(snapshot) {
    return Ember.String.decamelize(snapshot.typeKey);
  };

  var json = Ember.run(function() {
    var snapshot = tom._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    first_name: 'Tom',
    last_name: 'Dale',
    links: {
      evil_minions: {
        linkage: [],
      },
      home_planet: {
        linkage: {
          id: get(league, 'id'),
          type: 'home_planets'
        }
      }
    }
  });
});

test('serializeIntoHash', function() {
  var json = {};

  Ember.run(function(){
    var league = env.store.createRecord(HomePlanet, {
      name: 'Umber',
      id: '123'
    });

   var snapshot = league._createSnapshot();
   env.serializer.serializeIntoHash(json, HomePlanet, snapshot);
  });

  deepEqual(json, {
    'home-planet': {
      name: 'Umber',
      links: {
        'super-villains': {
          linkage: []
        }
      },
      type: 'home-planets'
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

    var snapshot = league._createSnapshot();
    env.serializer.serializeIntoHash(json, HomePlanet, snapshot);
  });

  deepEqual(json, {
    'home-planet': {
      name: 'Umber',
      links: {
        'super-villains': {
          linkage: []
        }
      },
      type: 'home-planets'
    }
  });
});

test('serialize has many relationships', function() {
  var minime, minime2, drevil;

  Ember.run(function() {
    drevil = env.store.createRecord(MegaVillain, {
      firstName: 'Dr',
      lastName: 'Evil'
    });

    minime = env.store.createRecord(BlueMinion, {
      id: '123',
      name: 'Mini me',
      superVillain: drevil
    });

    minime2 = env.store.createRecord(BlueMinion, {
      id: '345',
      name: 'Mini me 2',
      superVillain: drevil
    });
  });

  var json = Ember.run(function(){
    var snapshot = drevil._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    'first-name': 'Dr',
    'last-name': 'Evil',
    links: {
      minions: {
        linkage: [{
          id: '123',
          type: 'blue-minions'
        }, {
          id: '345',
          type: 'blue-minions'
        }]
      }
    }
  });
});

test('serialize belongs to relationships', function() {
  var male, female;

  Ember.run(function() {
    // Of course they belong to each other
    female = env.store.createRecord(FemaleMinion, {
      name: 'Bobbie Sue'
    });
    male = env.store.createRecord(MaleMinion, {
      id: 2,
      wife: female
    });
  });

  var json = Ember.run(function(){
    var snapshot = female._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    links: {
      husband: {
        linkage: {
          id: '2',
          type: 'male-minions'
        }
      }
    },
    name: 'Bobbie Sue'
  });
});

test('serialize polymorphic belongs to relationships', function() {
  var male, female;

  Ember.run(function() {
    // Of course they belong to each other
    female = env.store.createRecord(FemaleMinion, {
      id: 1,
      name: 'Bobbie Sue'
    });
    male = env.store.createRecord(MaleMinion, {
      id: 2,
      spouse: female,
      name: 'Billy Joe'
    });
  });

  var json = Ember.run(function(){
    var snapshot = male._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    links: {
      spouse: {
        linkage: {
          id: '1',
          type: 'female-minions'
        }
      }
    },
    name: 'Billy Joe'
  });
});

test('normalize camelCased', function() {
  var superVillain_hash = {
    firstName: 'Tom',
    lastName: 'Dale',
    links: {
      homePlanet: {
        linkage: {
          id: '123',
          type: 'homePlanets'
        }
      },
      evilMinions: {
        linkage: [{
          id: 1,
          type: 'evilMinions'
        },
        {
          id: 2,
            type: 'evilMinions'
        }]
      }
    }
  };

  var json = Ember.run(function() {
    return env.serializer.normalize(SuperVillain, superVillain_hash, 'superVillain');
  });

  deepEqual(json, {
    firstName: 'Tom',
    lastName: 'Dale',
    links: {
      homePlanet: {
        linkage: {
          id: '123',
          type: 'homePlanets'
        }
      },
      evilMinions: {
        linkage: [{
          id: 1,
          type: 'evilMinions'
        }, {
          id: 2,
          type: 'evilMinions'
        }]
      }
    }
  });
});

test('normalize links camelized', function() {
  var homePlanet = {
    id: '1',
    name: 'Umber',
    links: {
      superVillains: '/api/super_villians/1'
    },
    type: 'homePlanets'
  };

  var json = Ember.run(function() {
    return env.serializer.normalize(HomePlanet, homePlanet, 'homePlanet');
  });

  equal(json.links.superVillains,  '/api/super_villians/1', 'normalize links');
});

test('extractSingle snake_case', function() {
  env.container.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
    data: {
      id: '1',
      name: 'Umber',
      links: {
        super_villains: {
          linkage: [{
            id: 1,
            type: 'super_villains'
          }]
        }
      },
      type: 'home_planets'
    },
    included: [{
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      links: {
        home_planet: {
          linkage: {
            id: '1',
            type: 'home_planets'
          }
        }
      },
      type: 'super_villains'
    }]
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  };

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
    data: {
      id: '1',
      name: 'Umber',
      links: {
        super_villains: {
          linkage: [{
            id: 1,
            type: 'super_villains'
          }]
        }
      },
      type: 'home_planets'
    },
    included: [{
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      links: {
        home_planet: {
          linkage: {
            id: '1',
            type: 'home_planets'
          }
        }
      },
      type: 'super_villains'
    }]
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
    data: [{
      id: '1',
      name: 'Umber',
      links: {
        super_villains: {
          linkage: [{
            id: 1,
            type: 'super_villains'
          }]
        }
      },
      type: 'home_planets'
    }],
    included: [{
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      links: {
        home_planet: {
          linkage: {
            id: '1',
            type: 'home_planet'
          }
        }
      },
      type: 'super_villains'
    }]
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  };

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
    data: [{
      id: '1',
      name: 'Umber',
      links: {
        super_villains: {
          linkage: [{
            id: 1,
            type: 'super_villains'
          }]
        }
      },
      type: 'home_planets'
    }],
    included: [{
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      links: {
        home_planet: {
          linkage: {
            id: '1',
            type: 'home_planets'
          }
        }
      },
      type: 'super_villains'
    }]
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  };

  Ember.run(function() {
    env.serializer.extractArray(env.store, HomePlanet, json_hash);
  });

  env.store.find('superVillain', 1).then(function(minion){
    equal(minion.get('firstName'), 'Tom');
  });
});

test('looking up a belongsTo association', function() {
  env.container.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
    data: [{
      id: '1',
      name: 'Umber',
      links: {
        super_villains: {
          linkage: [{
            id: 1,
            type: 'super_villains'
          }]
        }
      },
      type: 'home_planets'
    }],
    included: [{
      id: '1',
      first_name: 'Tom',
      last_name: 'Dale',
      links: {
        home_planet: {
          linkage: {
            id: '1',
            type: 'home_planets'
          }
        }
      },
      type: 'super_villains'
    }]
  };

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.decamelize(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.decamelize(key);
  };

  Ember.run(function() {
    env.store.pushMany('homePlanet', env.serializer.extractArray(env.store, HomePlanet, json_hash));
  });

  Ember.run(function() {
    env.store.find('homePlanet', 1).then(function(planet){
      return planet.get('superVillains').then(function(villains) {
        equal(villains.get('firstObject').get('id'), 1);
      });
    });
  });
});
