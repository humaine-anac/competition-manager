const { Model } = require('objection');

class RunningAgent extends Model {
  static get tableName() {
    return 'running_agents';
  }

  static get relationMappings() {
    const Round = require('./round');

    return {
      round: {
        relation: Model.BelongsToOneRelation,
        modelClass: Round,
        join: {
          from: 'running_agents.round_id',
          to: 'rounds.id'
        }
      }
    };
  }

  get utilityFunctions() {
    return JSON.parse(this.utility_functions);
  }
}

module.exports = RunningAgent;
