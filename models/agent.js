const { Model } = require('objection');

class Agent extends Model {
  static get tableName() {
    return 'agents';
  }

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    if (json.run_cmd && typeof json.run_cmd === 'string') {
      json.run_cmd = JSON.parse(json.run_cmd);
    }

    return json;
  }

  $formatDatabaseJson(json) {
    if (json.run_cmd && typeof json.run_cmd !== 'string') {
      json.run_cmd = JSON.stringify(json.run_cmd);
    }

    return super.$formatDatabaseJson(json);
  }
}

module.exports = Agent;
