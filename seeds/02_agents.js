const { join, resolve } = require('path');

exports.seed = function(knex) {
  return knex('agents').del().then(() => {
    return knex('agents').insert([
      {
        name: 'agent-jok-1',
        cwd: resolve(join(__dirname, '..', '..', 'agent-jok')),
        run_cmd: JSON.stringify({"run":"node","args":["agent-jok.js","--level",2]})
      },
      {
        name: 'agent-jok-2',
        cwd: resolve(join(__dirname, '..', '..', 'agent-jok')),
        run_cmd: JSON.stringify({"run":"node","args":["agent-jok.js","--level",2]})
      },
      {
        name: 'HUMAINE',
        cwd: resolve(join(__dirname, '..', '..', 'contestant-agents', 'HUMAINE')),
        run_cmd: JSON.stringify({
          run: 'node',
          args: [
            'agent.js'
          ]
        })
      },
      {
        name: 'companion-agent',
        cwd: resolve(join(__dirname, '..', '..', 'contestant-agents', 'companion-agent')),
        run_cmd: JSON.stringify({
          run: 'python3',
          args: [
            'agent-py.py'
          ]
        })
      },
      {
        name: 'humaine-agent-2020',
        cwd: resolve(join(__dirname, '..', '..', 'contestant-agents', 'humaine-agent-2020')),
        run_cmd: JSON.stringify({
          run: 'node',
          args: [
            'agent-jok.js'
          ]
        })
      }
    ]);
  });
};
