import bcrypt from "bcrypt";
import _ from "lodash";
import { tryLogin } from "../helpers/auth";
import { formatErrors } from "../helpers/formatErrors";
import { requiresAuth } from "../helpers/permissions";

export default {
  User: {
    teams: (parent, args, { models, user }) =>
      models.sequelize.query(
        "select * from teams as team join members as member on team.id = member.team_id where member.user_id = ?",
        {
          replacements: [user.id],
          model: models.Team,
          raw: true,
        }
      ),
  },

  Query: {
    me: requiresAuth.createResolver((parent, args, { models, user }) =>
      models.User.findOne({ where: { id: user.id } })
    ),
    user: requiresAuth.createResolver((parent, { userId }, { models }) =>
      models.User.findOne({ where: { id: userId } })
    ),
    allUsers: (parent, args, { models }) => models.User.findAll(),
  },

  Mutation: {
    register: async (parent, { password, ...otherArgs }, { models }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await models.User.create({
          ...otherArgs,
          password: hashedPassword,
        });

        return {
          ok: true,
          user,
        };
      } catch (error) {
        return {
          ok: false,
          errors: formatErrors(error, models),
        };
      }
    },
    login: async (parent, { email, password }, { models, SECRET, SECRET2 }) =>
      tryLogin(email, password, models, SECRET, SECRET2),
  },
};
