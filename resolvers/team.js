import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../helpers/permissions";

export default {
  Query: {
    teamMembers: requiresAuth.createResolver(
      async (parent, { teamId }, { models, user }) =>
        models.sequelize.query(
          'select * from users as u join members as member on member.user_id = u.id where member.team_id = ?',
          {
            replacements: [teamId],
            model: models.User,
            raw: true,
          }
        )
    ),
  },
  Mutation: {
    createTeam: requiresAuth.createResolver(
      async (parent, args, { models, user }) => {
        try {
          const response = await models.sequelize.transaction(async () => {
            const team = await models.Team.create({ ...args });
            await models.Channel.create({
              name: "general",
              public: true,
              teamId: team.id,
            });
            await models.Member.create({
              teamId: team.id,
              userId: user.id,
              admin: true,
            });
            return team;
          });

          return {
            ok: true,
            team: response,
          };
        } catch (err) {
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      }
    ),
    createTeamMember: requiresAuth.createResolver(
      async (parent, { email, teamId }, { models, user }) => {
        try {
          const userToAddPromise = models.User.findOne(
            { where: { email } },
            { raw: true }
          );

          const memberToCheckPromise = models.Member.findOne(
            { where: { userId: user.id, teamId } },
            { raw: true }
          );

          const [userToAdd, memberToCheck] = await Promise.all([
            userToAddPromise,
            memberToCheckPromise,
          ]);

          if (!memberToCheck.admin) {
            return {
              ok: false,
              errors: [
                {
                  path: "email",
                  message: "You cannot add members to this team",
                },
              ],
            };
          }

          if (!userToAdd) {
            return {
              ok: false,
              errors: [
                {
                  path: "email",
                  message: "Could not find user with this email",
                },
              ],
            };
          }

          await models.Member.create({ userId: userToAdd.id, teamId });

          return {
            ok: true,
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
  Team: {
    channels: ({ id }, args, { models }) =>
      models.Channel.findAll({ where: { teamId: id } }),
    members: async ({ id }, args, { models }) => {
      console.log("id", id);
      console.log(typeof id);
      const users = await models.sequelize.query(
        "select * from users as user join members as member on user.id = member.user_id where member.team_id = ?",
        {
          replacements: [id],
          model: models.User,
          raw: true,
        }
      );
      console.log("printing users");
      console.log(users);
      return users;
    },
  },
};
