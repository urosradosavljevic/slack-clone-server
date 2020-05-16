export default (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "message",
    {
      text: { type: DataTypes.STRING },
    },
    { underscored: true }
  );

  Message.associate = (models) => {
    // 1:M
    Message.belongsTo(models.Channel, {
      foreignKey: { name: "channelId", field: "channel_id" },
    });
    // 1:M
    Message.belongsTo(models.User, {
      foreignKey: { name: "userId", field: "user_id" },
    });
  };

  return Message;
};
