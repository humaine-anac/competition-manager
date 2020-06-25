const { Model } = require('objection');

class Round extends Model {
  static get tableName() {
    return 'rounds';
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    if (json.utility_functions) {
      json.utility_functions = JSON.parse(json.utility_functions);
    }

    if (json.messages !== undefined) {
      json.messages = JSON.parse('[' + json.messages.replace(/,$/, '') + ']');
    }

    if (json.results) {
      json.results = JSON.parse(json.results);
    }

    return json;
  }

  $formatDatabaseJson(json) {
    if (json.utility_functions && typeof json.utility_functions !== 'string') {
      json.utility_functions = JSON.stringify(json.utility_functions);
    }

    if (json.messages !== undefined) {
      if (json.messages.length === 0) {
        json.messages = '';
      }
      else {
        const stringified = JSON.stringify(json.messages);
        json.messages = stringified.substring(1, stringified.length - 1) + ','
      }
    }

    if (json.results && typeof json.results !== 'string') {
      json.results = JSON.stringify(json.results);
    }

    return super.$formatDatabaseJson(json);
  }

  static get relationMappings() {
    const User = require('./user');
    const Agent = require('./agent');
    const RunningAgent = require('./running_agent');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'rounds.user_id',
          to: 'users.id'
        }
      },

      agent_one: {
        relation: Model.BelongsToOneRelation,
        modelClass: Agent,
        join: {
          from: 'rounds.agent_one_id',
          to: 'agents.id'
        }
      },

      agent_two: {
        relation: Model.BelongsToOneRelation,
        modelClass: Agent,
        join: {
          from: 'rounds.agent_two_id',
          to: 'agents.id'
        }
      },

      running_agents: {
        relation: Model.HasManyRelation,
        modelClass: RunningAgent,
        join: {
          from: 'rounds.id',
          to: 'running_agents.round_id',
        }
      }
    };
  }

  get utilityFunctions() {
    return JSON.parse(this.utility_functions);
  }
}

module.exports = Round;
