export default (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
      validate: {},
    },
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
  });

  User.associate = (models) => {
    User.belongsToMany(models.Team, {
      through: models.Member,
      foreignKey: { name: "userId", field: "user_id" },
    });
    // N:M
    User.belongsToMany(models.Channel, {
      through: "channel_member",
      foreignKey: { name: "userId", field: "user_id" },
    });
    User.belongsToMany(models.Channel, {
      through: models.PCMember,
      foreignKey: { name: "userId", field: "user_id" },
    });
  };

  return User;
};
