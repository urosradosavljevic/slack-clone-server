const createReslover = (resolver) => {
  const baseResolver = resolver;
  baseResolver.createReslover = (childResolver) => {
    const newResolver = async (parent, args, context, info) => {
      await resolver(parent, args, context, info);
      return childResolver(parent, args, context, info);
    };
    return createReslover(newResolver);
  };
  return baseResolver;
};

// runs child resolver, if we don't get an error from passed resolver
export const requiresAuth = createReslover((parent, args, context) => {
  if (!context.user || !context.user.id) {
    throw new Error("Not authenticated");
  }
});
