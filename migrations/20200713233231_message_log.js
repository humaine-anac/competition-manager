
exports.up = function(knex) {
  return knex.schema.table('rounds', (table) => {
    table.text('all_messages').defaultTo('').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('rounds', (table) => {
    table.dropColumn('all_messages');
  });
};
