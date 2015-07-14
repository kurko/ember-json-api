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
    league = env.store.createRecord('homePlanet', {
      name: 'Villain League',
      id: '123'
    });

    tom = env.store.createRecord('superVillain', {
      id: '666',
      firstName: 'Tom',
      lastName: 'Dale',
      homePlanet: league
    });
  });

  var json = Ember.run(function() {
    var snapshot = tom._createSnapshot();
    return env.serializer.serialize(snapshot, { includeId: true, type: 'super-villian' });
  });

  deepEqual(json, {
    id: '666',
    type: 'super-villians',
    attributes: {
      'first-name': 'Tom',
      'last-name': 'Dale'
    },
    relationships: {
      'evil-minions': {
        data: []
      },
      'home-planet': {
        data: {
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
    return Ember.String.camelize(snapshot.modelName);
  };

  Ember.run(function() {
    league = env.store.createRecord('homePlanet', {
      name: 'Villain League',
      id: '123'
    });

    tom = env.store.createRecord('superVillain', {
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
    type: 'superVillains',
    attributes: {
      firstName: 'Tom',
      lastName: 'Dale'
    },
    relationships: {
      evilMinions: {
        data: []
      },
      homePlanet: {
        data: {
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
    league = env.store.createRecord('homePlanet', {
      name: 'Villain League',
      id: '123'
    });

    tom = env.store.createRecord('superVillain', {
      firstName: 'Tom',
      lastName: 'Dale',
      homePlanet: league
    });
  });

  env.serializer.keyForAttribute = function(key) {
    return Ember.String.underscore(key);
  };

  env.serializer.keyForRelationship = function(key, relationshipKind) {
    return Ember.String.underscore(key);
  };

  env.serializer.keyForSnapshot = function(snapshot) {
    return Ember.String.underscore(snapshot.modelName);
  };

  var json = Ember.run(function() {
    var snapshot = tom._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    type: 'super_villains',
    attributes: {
      first_name: 'Tom',
      last_name: 'Dale'
    },
    relationships: {
      evil_minions: {
        data: []
      },
      home_planet: {
        data: {
          id: get(league, 'id'),
          type: 'home_planets'
        }
      }
    }
  });
});

test('serializeIntoHash', function() {
  var actual = {};

  Ember.run(function(){
    var league = env.store.createRecord('homePlanet', {
      name: 'Umber',
      id: '123'
    });

   var snapshot = league._createSnapshot();
   env.serializer.serializeIntoHash(actual, HomePlanet, snapshot);
  });

  var expected = {
    'home-planet': {
      type: 'home-planets',
      relationships: {
        'super-villains': {
          data: []
        }
      },
      attributes: {
        'name': 'Umber'
      }
    }
  };

  deepEqual(actual, expected);
});

test('serializeIntoHash with decamelized types', function() {
  HomePlanet.modelName = 'home-planet';
  var json = {};

  Ember.run(function() {
    league = env.store.createRecord('homePlanet', {
      name: 'Umber',
      id: '123'
    });

    var snapshot = league._createSnapshot();
    env.serializer.serializeIntoHash(json, HomePlanet, snapshot);
  });

  deepEqual(json, {
    'home-planet': {
      attributes: {
        name: 'Umber'
      },
      relationships: {
        'super-villains': {
          data: []
        }
      },
      type: 'home-planets'
    }
  });
});

test('serialize has many relationships', function() {
  var minime, minime2, drevil;

  Ember.run(function() {
    drevil = env.store.createRecord('megaVillain', {
      firstName: 'Dr',
      lastName: 'Evil'
    });

    minime = env.store.createRecord('blueMinion', {
      id: '123',
      name: 'Mini me',
      superVillain: drevil
    });

    minime2 = env.store.createRecord('blueMinion', {
      id: '345',
      name: 'Mini me 2',
      superVillain: drevil
    });
  });

  var json = Ember.run(function() {
    var snapshot = drevil._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    type: 'mega-villains',
    attributes: {
      'first-name': 'Dr',
      'last-name': 'Evil'
    },
    relationships: {
      minions: {
        data: [{
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
    female = env.store.createRecord('femaleMinion', {
      name: 'Bobbie Sue'
    });
    male = env.store.createRecord('maleMinion', {
      id: 2,
      wife: female
    });
  });

  var json = Ember.run(function() {
    var snapshot = female._createSnapshot();
    return env.serializer.serialize(snapshot);
  });

  deepEqual(json, {
    type: 'female-minions',
    relationships: {
      husband: {
        data: {
          id: '2',
          type: 'male-minions'
        }
      }
    },
    attributes: {
      name: 'Bobbie Sue'
    }
  });
});

test('serialize polymorphic belongs to relationships', function() {
  var male, female;

  Ember.run(function() {
    // Of course they belong to each other
    female = env.store.createRecord('femaleMinion', {
      id: 1,
      name: 'Bobbie Sue'
    });
    male = env.store.createRecord('maleMinion', {
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
    type: 'male-minions',
    relationships: {
      spouse: {
        data: {
          id: '1',
          type: 'female-minions'
        }
      }
    },
    attributes: {
      name: 'Billy Joe'
    }
  });
});

test('extractSingle snake_case', function() {
  env.registry.register('adapter:superVillain', DS.ActiveModelAdapter);

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

  env.store.find('superVillain', 1).then(function(minion) {
    equal(minion.get('firstName'), 'Tom');
  });
});

test('extractSingle camelCase', function() {
  env.registry.register('adapter:superVillain', DS.ActiveModelAdapter);

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

  env.store.find('superVillain', 1).then(function(minion) {
    equal(minion.get('firstName'), 'Tom');
  });
});

test('extractArray snake_case', function() {
  env.registry.register('adapter:superVillain', DS.ActiveModelAdapter);

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

  env.store.find('superVillain', 1).then(function(minion) {
    equal(minion.get('firstName'), 'Tom');
  });
});
// TODO: test something that utilizes the flattening of links in normalize

test('extractArray', function() {
  env.registry.register('adapter:superVillain', DS.ActiveModelAdapter);

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
  env.registry.register('adapter:superVillain', DS.ActiveModelAdapter);

  var json_hash = {
    data: [{
      id: '1',
      name: 'Umber',
      relationships: {
        super_villains: {
          data: [{
            id: 1,
            type: 'super_villains'
          }]
        }
      },
      type: 'home_planets'
    }],
    included: [{
      id: '1',
      attributes: {
        first_name: 'Tom',
        last_name: 'Dale'
      },
      relationships: {
        home_planet: {
          data: {
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
    env.store.find('homePlanet', 1).then(function(planet) {
      return planet.get('superVillains').then(function(villains) {
        equal(villains.get('firstObject').get('id'), 1);
      });
    });
  });
});
