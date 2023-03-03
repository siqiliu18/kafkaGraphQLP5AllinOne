const { Kafka } = require("kafkajs");
const { createServer } = require("http");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { PubSub, withFilter } = require("graphql-subscriptions");

// kafka consumer
const kafka = new Kafka({
  clientId: 'nodejs-consumer',
  brokers: ['localhost:9093', 'localhost:9094', 'localhost:9095'],
});

const consumer = kafka.consumer({ groupId: 'consumer-group-1' });

const run = async () => {
  // Consuming
  await consumer.connect();
  await consumer.subscribe({ topic: 'topic-status' });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('????? ' + topic);
      console.log({
        partition,
        offset: message.offset,
        value: 'topic-status: ' + message.value.toString(),
      });
      let status = message.value.toString();
      console.log('received message: ', status);
      pubsub.publish(LATEST_STATUS, { statusUpdated: status });
      console.log('>>> after pubsub.publish!');
    },
  });
};

run().catch(console.error);
console.log('>>>>>>>> right after run().catch(console.error) <<<<<<<<<<<<<');

const pubsub = new PubSub();
const LATEST_STATUS = 'STATUS'

let statuses = [
  {
    cbeDNA: "G123",
    oppDNA: "",
    scenario: "BE",
    statuses: [
      {
        key: "CBEDESC",
        status: 2
      }
    ]
  },
  {
    cbeDNA: "G234",
    oppDNA: "",
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
      console.log("Mutation - args: ", args);
      return statuses[1];
    },
  },

  Subscription: {
    statusUpdated: {
      resolve: (payload) => {
        console.log("3. Payload: ", payload);
        const event = JSON.parse(payload.statusUpdated);
        const out = {
          cbeDna: event.CbeDNA,
          oppDna: event.OppDNA,
          scenario: event.Scenario,
          statuses: event.Statuses.map(item => {
            return {
              key: item.UniqueKey,
              status: item.StatusCode
            };
          })
        }
        console.log("4. out: ", out);
        return out
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator([LATEST_STATUS]),
        (payload, variables) => {
          console.log("1. Payload: ", payload);
          const event = JSON.parse(payload.statusUpdated);
          console.log("2. variables: ", variables);
          return variables.cbeDna === event.CbeDNA;
        }
      )
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
