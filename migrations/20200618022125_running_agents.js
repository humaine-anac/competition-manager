
exports.up = function(knex) {
  return knex.schema
    .createTable('running_agents', (table) => {
      table.increments('id');
      table.integer('round_id').unsigned();
      table.foreign('round_id').references('rounds.id');
      table.integer('pid').unsigned().notNullable();
      table.integer('port').unsigned().notNullable();
    })
    .table('rounds', (table) => {
      table.dropColumn('agent_one_pid');
      table.dropColumn('agent_two_pid');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('running_agents')
    .table('rounds', (table) => {
      table.integer('agent_one_pid').unsigned().nullable();
      table.integer('agent_two_pid').unsigned().nullable();
    });
};
