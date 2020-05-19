import bcrypt from "bcrypt";
import _ from "lodash";
import { tryLogin } from "../auth";

const formatErrors = (e, models) => {
  if (e instanceof models.Sequelize.UniqueConstraintError) {
    const name = e.original.constraint.split("_")[1];
    return [
      {
        path: name,
        message: "User with this " + name + " already exists.",
      },
    ];
  }
  if (e instanceof models.Sequelize.ValidationError) {
    return e.errors.map((x) => _.pick(x, ["path", "message"]));
  }
  return [{ path: "name", message: "something went wrong" }];
};

export default {
  Query: {
    getUser: (parent, { id }, { models }) =>
      models.User.findOne({ where: { id } }),
    allUsers: (parent, args, { models }) => models.User.findAll(),
    login: async (parent, { email, password }, { models, SECRET, SECRET2 }) =>
      tryLogin(email, password, models, SECRET, SECRET2),
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
  },
};
