const fetch = require('node-fetch');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const Knex = require('knex');
const { Model } = require('objection');
const http = require('http');
const { optionsToUrl } = require('@humaine/utils/url');
const { setLogLevel, logExpression } = require('@cisl/zepto-logger');
const argv = require('minimist')(process.argv.slice(2));
const {v4: uuidv4} = require('uuid');

const appSettings = require('./appSettings');

const knex = Knex(require('./knexfile')['development']);
Model.knex(knex);

const User = require('./models/user');
const Agent = require('./models/agent');
const Round = require('./models/round');
const RunningAgent = require('./models/running_agent');

const app = express();
const httpServer = http.createServer(app);

const durations = {
  warmUp: 60,
  round: 60 * 10,
  post: 60
};

let myPort = process.env.PORT || argv.port || 14020;
let logLevel = 1;
if (argv.level) {
  logLevel = argv.level;
  logExpression(`Setting log level to ${logLevel}`);
}
setLogLevel(logLevel);

app.use(
  session({
    secret: appSettings.secret,
    store: new KnexSessionStore({
      knex,
      tableName: 'sessions',
    }),
    resave: false,
    proxy: true,
    saveUninitialized: false,
  })
);

const sessionChecker = (req, res, next) => {
  if (!req.session.user) {
      res.redirect('/login');
  } else {
      next();
  }
};

const userChecker = (req, res, next) => {
  if (parseInt(req.params.userId) !== req.session.user.id && !req.session.user.admin) {
    return res.redirect(`/user/${req.session.user.id}`);
  }
  next();
};

const adminChecker = (req, res, next) => {
  if (req.session.user.admin) {
    return next();
  }
  res.render('404');
};

const adminSessionChecker = [sessionChecker, adminChecker];
const userSessionChecker = [sessionChecker, userChecker];

app.use(express.static(path.join(__dirname, "/static")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('port', myPort);
app.set('view engine', 'ejs');

app.use((req, _, next) => {
  logExpression(`Inside ${req.url} (${req.method})`);
  next();
});

app.post('/receiveMessage', async (req, res) => {
  logExpression('Inside /receiveMessage', 2);
  logExpression(req.body, 2);
  const round = await Round.query().findOne({uuid: req.body.roundId});
  round.messages.push(req.body);
  await Round.query().findById(round.id).patch({messages: round.messages});
  res.json({'status': 'acknowledged'});
});

app.post('/confirmAccept', (_, res) => {
  res.json({'status': 'acknowledged'});
});

app.post('/setUtility', (req, res) => {
  /*
  logExpression('Inside /setUtility', 2);
  logExpression(req.body, 2);
  */
  res.json({'status': 'acknowledged'});
});

app.post('/receiveRejection', (req, res) => {
  /*
  logExpression('Inside /receiveRejection', 2);
  logExpression(req.body, 2);
  */
  res.json({'status': 'acknowledged'});
});

app.post('/receiveLog', async (req, res) => {
  console.log(req.body);
  const round = await Round.query().findOne({uuid: req.body.roundId});
  if (!round) {
    return res.json({'status': 'error'});
  }

  round.all_messages.push(req.body);
  await Round.query().findById(round.id).patch({all_messages: round.all_messages});

  res.json({'status': 'acknowledged'});
});

app.post('/startRound', (_, res) => {
  res.json({'status': 'acknowledged'});
});

app.post('/endRound', (_, res) => {
  res.json({'status': 'acknowledged'});
});

app.post('/sendRoundMetadata', async (req, res) => {
  const round = await Round.query().withGraphFetched('[user, agent_one, agent_two, running_agents]').findOne({uuid: req.body.roundId});
  if (!round) {
    return res.json({'status': 'error'});
  }

  const agents = {one: Object.assign({}, round.agent_one), two: Object.assign({}, round.agent_two)};
  agents.one.port = round.running_agents[0].port;
  agents.one.run_cmd.args.push('--port', agents.one.port, '--roundId', round.uuid);
  agents.two.port = round.running_agents[1].port;
  agents.two.run_cmd.args.push('--port', agents.two.port, '--roundId', round.uuid);

  agent_one_process = spawn(agents.one.run_cmd.run, agents.one.run_cmd.args, {
    cwd: agents.one.cwd,
    detached: true,
    stdio: 'ignore',
  });
  agent_one_process.unref();

  agent_two_process = spawn(agents.two.run_cmd.run, agents.two.run_cmd.args, {
    cwd: agents.two.cwd,
    detached: true,
    stdio: 'ignore',
  });
  agent_two_process.unref();

  const promises = [];
  promises.push(RunningAgent.query().patch({
    pid: agent_one_process.pid,
  }).where({id: round.running_agents[0].id}));

  promises.push(RunningAgent.query().patch({
    pid: agent_two_process.pid,
  }).where({id: round.running_agents[1].id}));

  await Promise.all(promises);
  /*
  logExpression('Inside /sendRoundMetadata', 2);
  logExpression(req.body, 2);
  */
  setTimeout(() => {
    res.json({
      status: 'acknowledged',
      agents: [
        {
          pid: agent_one_process.pid,
          port: round.running_agents[0].port
        },
        {
          pid: agent_two_process.pid,
          port: round.running_agents[1].port
        }
      ]
    });
  }, 2000);
});

app.post('/receiveRoundTotals', async (req, res) => {
  logExpression('Inside /receiveRoundTotals', 2);
  logExpression(req.body, 2);
  await Round.query().findOne({uuid: req.body.roundId}).patch({
    results: req.body,
    started: true,
    completed: true,
  });

  const round = await Round.query().findOne({uiid: req.body.roundId});
  if (!round) {
    return res.render('404');
  }

  const agents = await RunningAgent.query().where({round_id: round.id});
  for (const agent of agents) {
    try {
      process.kill(agent.pid);
    }
    catch (exc) {
      console.error(`ERROR: could not kill agent PID - ${agent.pid} - ${exc}`);
    }
  }
  await RunningAgent.query().delete().where({round_id: round.id});

  res.json({'status': 'acknowledged'});
});

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(`/user/${req.session.user.id}`)
  }
  res.redirect('/login');
});

app.route('/login').get((_, res) => {
  res.render('login');
}).post(async (req, res) => {
  const user = await User.query().findOne({
    email: req.body.email,
    code: req.body.code,
  });
  if (user) {
    req.session.user = user;
    res.redirect(`/user/${user.id}`);
  }
  else {
    res.redirect('/login');
  }
});

app.get('/logout', sessionChecker, async (req, res) => {
  delete req.session.user;
  res.redirect('/');
});

app.route('/agents').get(adminSessionChecker, async (req, res) => {
  const agents = await Agent.query();
  res.render('agents', {
    user: req.session.user,
    agents
  })
}).post(adminSessionChecker, async (req, res) => {
  Agent.query().insert({
    name: req.body.name,
    cwd: req.body.cwd,
    run_cmd: JSON.stringify(JSON.parse(req.body.run_cmd)),
  }).then(() => {
    res.redirect('/agents');
  });
});

app.get('/agents/delete/:agentId([0-9]+)', adminSessionChecker, async (req, res) => {
  Agent.query().delete().where({id: req.params.agentId}).then(() => {
    res.redirect('/agents');
  });
});

app.route('/users').get(adminSessionChecker, async (req, res) => {
  const users = await User.query();
  res.render('users', {
    user: req.session.user,
    users: users
  });
}).post(adminSessionChecker, (req, res) => {
  User.query().insert({
    email: req.body.email,
    code: req.body.code,
    admin: req.body.admin ? true : false,
  }).then(() => {
    res.redirect('/users');
  });
});

app.get('/user/:userId([0-9]+)/delete', adminSessionChecker, (req, res) => {
  User.query().delete().where({id: req.params.userId}).then(() => {
    res.redirect('/users');
  });
});

app.get('/user/:userId([0-9]+)', userSessionChecker, async (req, res) => {
  const user = await User.query().findById(req.params.userId);
  if (!user) {
    return res.render('404');
  }
  const rounds = await Round.query().withGraphFetched('[user, agent_one, agent_two]').where({user_id: user.id});
  const agents = await Agent.query();

  res.render('user', {
    user: req.session.user,
    thisUser: user,
    rounds,
    agents,
    competitionUrl: optionsToUrl(appSettings.serviceMap['competition-ui']),
  });
});

app.post('/user/:userId([0-9]+)/round', userSessionChecker, (req, res) => {
  const promises = [];
  promises.push(
    fetch(optionsToUrl(appSettings.serviceMap['utility-generator'], '/generateUtility/buyer')).then(res => res.json())
  );
  for (let i = 0; i < 2; i++) {
    promises.push(
      fetch(optionsToUrl(appSettings.serviceMap['utility-generator'], '/generateUtility/seller')).then(res => res.json())
    );
  }

  Promise.all(promises).then((results) => {
    Round.query().insert({
      uuid: uuidv4(),
      user_id: req.params.userId,
      agent_one_id: req.body.agent_one,
      agent_two_id: req.body.agent_two,
      utility_functions: {human: results[0], agent_one: results[1], agent_two: results[2]},
    }).then(() => {
      res.redirect(`/user/${req.params.userId}`);
    });
  });
});

app.get('/user/:userId([0-9]+)/round/:roundId([0-9]+)/delete', adminSessionChecker, (req, res) => {
  Round.query().delete().where({id: req.params.roundId, user_id: req.params.userId}).then(() => {
    res.redirect(`/user/${req.params.userId}`);
  });
});

app.get('/user/:userId([0-9]+)/round/:roundId([0-9]+)/details', adminSessionChecker, async (req, res) => {
  const round = await Round.query().withGraphFetched('[user, agent_one, agent_two, running_agents]').findOne({id: req.params.roundId, user_id: req.params.userId});
  res.json(round);
});

async function getPort() {
  while (true) {
    // port range: 52000 - 60000
    const port = Math.floor(Math.random() * (60000 - 52000) + 52000);
    const agent = await RunningAgent.query().findOne({port: port});
    if (!agent) {
      return port;
    }
  }
}

app.get('/user/:userId([0-9]+)/round/:roundId([0-9]+)/reset', adminSessionChecker, async (req, res) => {
  const round = await Round.query().findOne({id: req.params.roundId, user_id: req.params.userId});
  if (!round) {
    return res.render('404');
  }

  const agents = await RunningAgent.query().where({round_id: round.id});
  for (const agent of agents) {
    if (agent.pid === null) {
      continue;
    }
    try {
      process.kill(agent.pid);
    }
    catch (exc) {
      console.error(`ERROR: could not kill agent PID - ${agent.pid} - ${exc}`);
    }
  }
  await RunningAgent.query().delete().where({round_id: round.id});
  await Round.query().update({
    started: false,
    completed: false,
    results: null,
    messages: [],
    all_messages: [],
  }).where({id: round.id});
  res.redirect(`/user/${req.params.userId}`);
});

app.post('/user/:userId([0-9]+)/round/:roundId([0-9]+)/start', userSessionChecker, async (req, res) => {
  const round = await Round.query().withGraphFetched('[user, agent_one, agent_two, running_agents]').findOne({id: req.params.roundId, user_id: req.params.userId});
  const agents = {one: Object.assign({}, round.agent_one), two: Object.assign({}, round.agent_two)};

  if (!round) {
    res.json({error: 'could not find round'});
    return;
  }

  if (round.completed) {
    return res.json({error: 'round already completed', round});
  }
  else if (round.started) {
    return res.json({error: 'round already started', round});
  }

  agents.one.port = await getPort();
  agents.two.port = await getPort();

  const roundData = {
    roundId: round.uuid,
    agents: [
      {
        protocol: 'http',
        host: 'localhost',
        port: agents.one.port,
        utilityFunction: round.utility_functions.agent_one,
        name: 'Watson',
      },
      {
        protocol: 'http',
        host: 'localhost',
        port: agents.two.port,
        utilityFunction: round.utility_functions.agent_two,
        name: 'Celia',
      }
    ],
    human: {
      utilityFunction: round.utility_functions.human
    },
    durations,
  };

  const fetchRes = await fetch(optionsToUrl(appSettings.serviceMap['environment-orchestrator'], '/initializeRound'), {
    method: 'POST',
    body: JSON.stringify(roundData),
    headers: { 'Content-Type': 'application/json' },
  });
  await fetchRes.json();

  const promises = [];

  promises.push(Round.query().patch({
    started: true
  }).where({id: round.id}));

  promises.push(RunningAgent.query().insert({
    round_id: round.id,
    pid: null,
    port: agents.one.port
  }));

  promises.push(RunningAgent.query().insert({
    round_id: round.id,
    pid: null,
    port: agents.two.port
  }));

  await Promise.all(promises);

  res.json({'status': 'success'});
});

httpServer.listen(app.get('port'), () => {
  logExpression(`Express server listening on port ${app.get('port')}`, 1);
});
