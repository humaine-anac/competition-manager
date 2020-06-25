const { DataTypes } = require('sequelize');
const { raw } = require('express');

module.exports = (sequelize) => {
  const Agent = sequelize.define('Agent', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    cwd: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    runCmd : {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      field: 'run_cmd',
      get() {
        const rawValue = this.getDataValue(runCmd);
        return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      }
    },
  }, {
    underscored: true
  });

  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  }, {
    underscored: true
  });

  const Round = sequelize.define('Round', {
    agentOnePid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'agent_one_pid',
    },
    agentTwoPid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'agent_two_pid',
    },
    started: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    utilityFunctions: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'utility_functions'
    },
    messages: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    results: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    underscored: true
  });

  User.hasMany(Round);
  Round.belongsTo(User);

  /*
  Round.belongsTo(Agent, {foreignKey: 'agent_one_id'});
  Round.belongsTo(Agent, {foreignKey: 'agent_two_id'});
  */

  return {
    Agent,
    User,
    Round
  };
};
