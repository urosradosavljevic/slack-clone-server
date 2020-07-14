import axios from "axios";

const loginUser = async () => {
  const loginResponse = await axios.post("http://localhost:4000/", {
    query: `
      mutation{
        login(email: "jovan@mail.com", password:"jovanjovan"){
          token
          refreshToken
        }
      }
  `,
  });

  const {
    data: {
      data: {
        login: { token, refreshToken },
      },
    },
  } = loginResponse;

  return { token, refreshToken };
};

describe("user resolvers", () => {
  test("register user", async () => {
    const registerResponse = await axios.post("http://localhost:4000/", {
      query: `
        mutation{
          register(username: "jovan", email: "jovan@mail.com", password: "jovanjovan"){
            ok
          }
        }
    `,
    });
    const data = registerResponse;
    expect(data).toMatchObject({
      register: {
        ok: true,
        user: {
          username: "jovan",
          email: "jovan@mail.com",
        },
        errors: null,
      },
    });
  });

  test("allUsers", async () => {
    const response = await axios.post("http://localhost:4000/", {
      query: `
                query{
                    allUsers{
                        id
                        username
                        email
                    }
                }
            `,
    });
    const { data } = response;
    expect(data).toMatchObject({
      data: {
        allUsers: [
          {
            id: 1,
            username: "jovan",
            email: "jovan@mail.com",
          },
        ],
      },
    });
  });

  test("login user and create team", async () => {
    const { token, refreshToken } = loginUser();

    const createTeamResponse = await axios.post(
      "http://localhost:4000/",
      {
        query: `
          mutation{
            createTeam(name: "test_team"){
              ok
              team{
                name
              }
            }
          }
    `,
      },
      {
        headers: {
          "x-token": token,
          "x-refresh-token": refreshToken,
        },
      }
    );

    const { data } = createTeamResponse;

    expect(data).toMatchObject({
      data: {
        createTeam: [
          {
            ok: true,
            name: "test_team",
          },
        ],
      },
    });
  });

  test("create Channel", async () => {
    const { token, refreshToken } = loginUser();

    const createChannelResponse = await axios.post(
      "http://localhost:4000/",
      {
        query: `
          mutation{
            createChannel(teamId: "1",name: "front",public: true){
              ok
              channel{
                name
              }
            }
          }
    `,
      },
      {
        headers: {
          "x-token": token,
          "x-refresh-token": refreshToken,
        },
      }
    );

    const { data } = createChannelResponse;

    expect(data).toMatchObject({
      data: {
        createChannel: [
          {
            ok: true,
            name: "front",
          },
        ],
      },
    });
  });
});
