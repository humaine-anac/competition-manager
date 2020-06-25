const { join, resolve } = require('path');

exports.seed = function(knex) {
  return knex('agents').del().then(() => {
    return knex('agents').insert([
      {name: 'agent-jok-1', cwd: resolve(join(__dirname, '..', '..', 'agent-jok')), 'run_cmd': {"run":"node","args":["agent-jok.js","--level",2]}},
      {name: 'agent-jok-2', cwd: resolve(join(__dirname, '..', '..', 'agent-jok')), 'run_cmd': {"run":"node","args":["agent-jok.js","--level",2]}}
    ]);
  });
};
