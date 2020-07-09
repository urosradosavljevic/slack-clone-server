import { PubSub, withFilter } from "apollo-server";
import { formatErrors } from "../helpers/formatErrors";

const NEW_DIRECT_MESSAGE = "NEW_DIRECT_MESSAGE";
// publish subscribe engine
const pubsub = new PubSub();

export default {
  Subscription: {
    newDirectMessage: {
      // Get notified by pubsub engine when new message has been sent
      subscribe: withFilter(
        () => pubsub.asyncIterator([NEW_DIRECT_MESSAGE]),
        (payload, { receiverId, teamId }) =>
          payload.receiverId === receiverId && payload.teamId === teamId
      ),
    },
  },

  Query: {
    directMessages: async (parent, { receiverId, teamId }, { models, user }) =>
      models.DirectMessage.findAll(
        {
          order: [["createdAt", "ASC"]],
          where: { receiverId, senderId: user.id, teamId },
        },
        { raw: true }
      ),
  },

  Mutation: {
    sendDirectMessage: async (parent, args, { models, user }) => {
      try {
        const message = await models.DirectMessage.create({
          ...args,
          senderId: user.id,
        });

        // Notify pubsub engine that message has been sent
        pubsub.publish(NEW_DIRECT_MESSAGE, {
          receiverId: args.receiverId,
          teamId: args.teamId,
          newChannelMessage: message.dataValues,
        });

        return {
          ok: true,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },

  DirectMessage: {
    receiver: ({ receiverId, senderId }, args, { models }) => {
      return models.User.findOne({ where: { id: receiverId } });
    },
    sender: ({ receiverId, senderId }, args, { models }) => {
      return models.User.findOne({ where: { id: senderId } });
    },
  },
};
