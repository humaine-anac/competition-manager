
exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id');
      table.string('email', 255).notNullable();
      table.string('code', 255).notNullable();
      table.boolean('admin').defaultTo(false).notNullable();
      table.unique('email');
    })
    .createTable('agents', (table) => {
      table.increments('id');
      table.string('name', 255).notNullable();
      table.string('cwd', 255).notNullable();
      table.json('run_cmd').notNullable().defaultTo({});
      table.unique('name');
    })
    .createTable('rounds', (table) => {
      table.increments('id');
      table.uuid('uuid').notNullable();
      table.integer('user_id').unsigned();
      table.foreign('user_id').references('users.id');
      table.integer('agent_one_id').unsigned();
      table.foreign('agent_one_id').references('agents.id');
      table.integer('agent_one_pid').unsigned().nullable();
      table.integer('agent_two_id').unsigned();
      table.foreign('agent_two_id').references('agents.id');
      table.integer('agent_two_pid').unsigned().nullable();
      table.boolean('started').defaultTo(false).notNullable();
      table.boolean('completed').defaultTo(false).notNullable();
      table.json('utility_functions').notNullable();
      table.text('messages').defaultTo('').notNullable();
      table.json('results').nullable();
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rounds').dropTable('agents').dropTable('users');
};
