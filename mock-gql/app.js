const { Kafka } = require("kafkajs");
const { createServer } = require("http");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { PubSub, withFilter } = require("graphql-subscriptions");
const { KafkaPubSub } = require("graphql-kafkajs-subscriptions");

const pubsub = KafkaPubSub.create({
  topic: "topic-status",
  groupIdPrefix: "nodejs-combine",
  kafka: new Kafka({
    brokers: ["localhost:9093", "localhost:9094", "localhost:9095"],
  }),
});

let statuses = [
  {
    cbeDna: "G123",
    oppDna: "",
    scenario: "BE",
    statuses: [
      {
        key: "CBEDESC",
        status: 2
      }
    ]
  },
  {
    cbeDna: "G234",
    oppDna: "",
    scenario: "BE",
    statuses: [
      {
        key: "GENERALINFO",
        status: 3
      }
    ]
  }
];

const typeDefs = `
  type Query {
    getStatuses: [Status]
  }

  type Status {
    cbeDna: String
    oppDna: String
    scenario: String
    statuses: [Applet]
  }

  type Applet {
    key: String
    status: Int
  }

  type Mutation {
    addStatus(status: String): Status
  }

  type Subscription {
    statusUpdated(cbeDna: String, oppDna: String): Status
  }
`;

const resolvers = {
  Query: {
    getStatuses: () => statuses,
  },

  Mutation: {
    addStatus: (parent, args) => {
      const newStatus = {
        cbeDna: "G345",
        oppDna: "O123",
        scenario: "OPP",
        statuses: [
          {
            key: "CSCASSIGNMENT",
            status: 3
          }
        ]
      };
      statuses.push(newStatus);
      return newStatus;
    },
  },

  Subscription: {
    statusUpdated: {
      resolve: (payload) => {
        console.log("In SUB's resolver: ", payload);
        const event = JSON.parse(payload.value.toString());
        console.log("In SUB's resolver: ", event);
        const out = {
          cbeDNA: event.CbeDNA,
          oppDNA: event.OppDNA,
          scenario: event.Scenario,
          statuses: event.Statuses.map(item => {
            return {
              key: item.UniqueKey,
              status: item.StatusCode
            }
          })
        }
        console.log("!!! out: ", out);
        return out;
      },
      subscribe: async (payload, variable) => {
        const asyncPubSub = await pubsub;
        return withFilter(
          () => asyncPubSub.asyncIterator("topic-status"),
          (payload, variables) => {
            console.log("In filter, payload = ", payload.value.toString());
            const event = JSON.parse(payload.value.toString());
            console.log("In filter, event = ", event);
            return event.CbeDNA === variables.cbeDna;
          }
        )(payload, variable);
      },
    },
  },
};

(async function () {
  const app = express();

  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const subscriptionServer = SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: "/graphql" }
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4981;
  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}/graphql`)
  );
})();
