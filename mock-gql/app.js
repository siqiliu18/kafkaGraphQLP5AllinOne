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
  groupIdPrefix: "demo1",
  kafka: new Kafka({
    brokers: ["localhost:9093", "localhost:9094", "localhost:9095"],
  }),
});

let statuses = [
  { id: 1, status: "NotStarted" },
  { id: 2, status: "InProgress" },
  { id: 3, status: "Completed" },
];

const typeDefs = `
  type Query {
    getStatuses: [Status]
  }

  type Status {
    id: Int
    status: String
  }

  type Mutation {
    addStatus(status: String): Status
  }

  type Subscription {
    getStatus(ID: Int): Status
  }
`;

const resolvers = {
  Query: {
    getStatuses: () => statuses,
  },

  Mutation: {
    addStatus: (parent, args) => {
      const newStatus = {
        id: statuses.length + 1,
        status: args.status,
      };
      statuses.push(newStatus);
      return newStatus;
    },
  },

  Subscription: {
    getStatus: {
      resolve: (payload) => {
        const { id, status } = JSON.parse(payload.value.toString());
        return { id, status };
      },
      subscribe: async (payload, variable) => {
        const asyncPubSub = await pubsub;
        return withFilter(
          () => asyncPubSub.asyncIterator("topic-status"),
          (payload, variables) => {
            console.log("In filter, ", payload.value.toString());
            const { id, status } = JSON.parse(payload.value.toString());
            return id === variables.ID;
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
