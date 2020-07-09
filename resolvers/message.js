import { PubSub, withFilter } from "apollo-server";

import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../helpers/permissions";
import pubsub from "../pubsub";

const NEW_CHANNEL_MESSAGE = "NEW_CHANNEL_MESSAGE";
// publish subscribe engine

export default {
  Subscription: {
    newChannelMessage: {
      // Get notified by pubsub engine when new message has been sent
      subscribe: withFilter(
        () => pubsub.asyncIterator([NEW_CHANNEL_MESSAGE]),
        (payload, { channelId }) => payload.channelId === channelId
      ),
    },
  },
  Query: {
    channelMessages: requiresAuth.createResolver(
      async (parent, { channelId }, { models }) => {
        const messages = await models.Message.findAll(
          { order: [["createdAt", "ASC"]], where: { channelId } },
          { raw: true }
        );
        return messages;
      }
    ),
  },
  Mutation: {
    sendMessage: async (parent, args, { models, user }) => {
      try {
        const message = await models.Message.create({
          ...args,
          userId: user.id,
        });

        // Notify pubsub engine that message has been sent
        pubsub.publish(NEW_CHANNEL_MESSAGE, {
          channelId: args.channelId,
          newChannelMessage: message.dataValues,
        });

        return {
          ok: true,
          message,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
  Message: {
    user: ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }
      return models.User.findOne({ where: { id: userId } });
    },
    channel: ({ channelId }, args, { models }) =>
      models.Channel.findOne({ where: { id: channelId } }),
  },
};
