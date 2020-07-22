exports.up = function(knex) {
  return knex.schema.table('rounds', (table) => {
    table.text('agent_one_stdout').defaultTo('');
    table.text('agent_one_stderr').defaultTo('');
    table.text('agent_two_stdout').defaultTo('');
    table.text('agent_two_stderr').defaultTo('');
  });
};

exports.down = function(knex) {
  return knex.schema.table('rounds', (table) => {
    table.dropColumn('agent_one_stdout');
    table.dropColumn('agent_one_stderr');
    table.dropColumn('agent_two_stdout');
    table.dropColumn('agent_two_stderr');
  });
};
