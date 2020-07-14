import { withFilter } from "apollo-server";

import { formatErrors } from "../helpers/formatErrors";
import pubsub from "../pubsub";
import { directMessageSubscriptionAuth } from "../helpers/permissions";

const NEW_DIRECT_MESSAGE = "NEW_DIRECT_MESSAGE";

export default {
  Subscription: {
    newDirectMessage: {
      // Get notified by pubsub engine when new message has been sent
      subscribe: directMessageSubscriptionAuth.createResolver(
        withFilter(
          () => pubsub.asyncIterator(NEW_DIRECT_MESSAGE),
          (payload, { userId, teamId }, { user }) =>
            payload.teamId === teamId &&
            ((payload.receiverId === user.id && payload.senderId === userId) ||
              (payload.receiverId === userId && payload.senderId === user.id) ||
              (payload.receiverId === user.id && payload.senderId === user.id))
        )
      ),
    },
  },

  Query: {
    directMessages: async (parent, { userId, teamId }, { models, user }) =>
      models.DirectMessage.findAll(
        {
          order: [["createdAt", "ASC"]],
          where: {
            teamId,
            [models.Sequelize.Op.or]: [
              {
                [models.Sequelize.Op.and]: [
                  { receiverId: userId },
                  { senderId: user.id },
                ],
              },
              {
                [models.Sequelize.Op.and]: [
                  { receiverId: user.id },
                  { senderId: userId },
                ],
              },
              {
                [models.Sequelize.Op.and]: [
                  { receiverId: user.id },
                  { senderId: user.id },
                ],
              },
            ],
          },
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
          senderId: user.id,
          teamId: args.teamId,
          newDirectMessage: {
            ...message.dataValues,
            sender: user,
          },
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

  DirectMessage: {
    receiver: ({ receiverId }, args, { models }) => {
      return models.User.findOne({ where: { id: receiverId } });
    },
    sender: ({ sender, senderId }, args, { models }) => {
      return sender ? sender : models.User.findOne({ where: { id: senderId } });
    },
  },
};
