import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../helpers/permissions";

export default {
  Mutation: {
    createChannel: requiresAuth.createResolver(
      async (parent, args, { models, user }) => {
        try {
          const team = await models.Team.findOne(
            { where: { id: args.teamId } },
            { raw: true }
          );

          if (team.owner !== user.id) {
            return {
              ok: false,
              errors: [
                {
                  path: "name",
                  message:
                    "You have to be the owner of the team to create channels",
                },
              ],
            };
          }
          const channel = await models.Channel.create(args);
          return {
            ok: true,
            channel,
          };
        } catch (err) {
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      }
    ),
  },
};
