const createResolver = (resolver) => {
  const baseResolver = resolver;
  baseResolver.createResolver = (childResolver) => {
    const newResolver = async (parent, args, context, info) => {
      await resolver(parent, args, context, info);
      return childResolver(parent, args, context, info);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

// runs child resolver, if we don't get an error from passed resolver
export const requiresAuth = createResolver((parent, args, context) => {
  if (!context.user || !context.user.id) {
    throw new Error("Not authenticated");
  }
});

// runs child resolver, if we don't get an error from passed resolver
export const teamMemberAuth = createResolver((parent, args, context) => {
  if (!context.user || !context.user.id) {
    throw new Error("Not authenticated");
  }
});

// runs child resolver, if we don't get an error from passed resolver
export const directMessageSubscriptionAuth = createResolver(
  async (parent, { teamId, userId }, { user, models }) => {
    if (!user || !user.id) {
      throw new Error("Not authenticated");
    }
    const members = await models.Member.findAll({
      where: {
        teamId,
        [models.Sequelize.Op.or]: [{ userId }, { userId: user.id }],
      },
    });
    if (members.length !== 2) {
      throw new Error("Something went wrong!");
    }
  }
);
