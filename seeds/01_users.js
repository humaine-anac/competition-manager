
exports.seed = function(knex) {
  return knex('users').del().then(() => {
    return knex('users').insert([
      {email: 'pevelm@rpi.edu', code: 'pevelm', admin: true},
      {email: 'divekar.rahul@gmail.com', code: 'divekar.rahul', admin: true},
      {email: 'kephart@us.ibm.com', code: 'kephart', admin: true},
      {email: 'huisuibmres@us.ibm.com', code: 'huisuibmres', admin: true},
      {email: 'hermam3@rpi.edu', code: 'hermam3', admin: true},
      {email: 'mgdebayser@br.ibm.com', code: 'mgdebayser', admin: true},
      {email: 'melinag@br.ibm.com', code: 'melinag', admin: true},
    ]);
  });
};
