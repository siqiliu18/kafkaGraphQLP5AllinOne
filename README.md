# kafkaGraphQLP5AllinOne

## The programs are using local kafka AKHQ server

## master branch: 
1. nest-gql: a nestjs program uses KafkaPubSub from graphql-kafkajs-subscriptions library.
2. mock-be: a nodejs program that provides an REST API and uses kafkajs to produce messages to a topic.
3. mock-fe: a react program that sends requests to mock-be's API and subscribes to graphql socket. 

**Note**: 
1. The parameter of subscription in mock-fe is *Float* because of nestjs graphQL id is ***number*** type.
2. The graphql-kafkajs-subscriptions library is bad because it created random suffix for consumer group where makes it impossible to scale up consumers within a group.

## nodejs-graphql-kafkajs-combine
1. mock-gql: a nodejs program that uses KafkaPubSub from graphql-kafkajs-subscriptions library.
2. mock-be: a nodejs program that provides an REST API and uses kafkajs to produce messages to a topic.
3. mock-fe: a react program that sends requests to mock-be's API and subscribes to graphql socket. 

**Note**: 
1. The parameter of subscription in mock-fe is *Int* because of mock-gql (nodejs) graphQL schema id is ***Int*** type.
2. The graphql-kafkajs-subscriptions library is bad because it created random suffix for consumer group where makes it impossible to scale up consumers within a group.

## nodejs-kafkajs-graphql-separate
**Schema First**
const typeDefs = `
  type Query {
    getStatuses: [Status]
  }

  type Status {
    cbeDNA: String
    oppDNA: String
    scenario: String
    statuses: [Applet]
  }

  type Applet {
    key: String
    status: Int
  }

  type Subscription {
    statusUpdated(cbeDna: String, oppDna: String): Status
  }
`;

**mock-fe**
const COMMENTS_SUBSCRIPTION = gql`
subscription Subscription($cbeDna: String, $oppDna: String) {
  statusUpdated(cbeDna: $cbeDna, oppDna: $oppDna) {
    cbeDNA
    oppDNA
    scenario
    statuses {
      status
      key
    }
  }
}
`;

## nestjs-kafkajs-graphql-separate
**Code First**
@ObjectType()
export class Status {
  @Field((type) => ID, { nullable: true })
  cbeDna: string;

  @Field({ nullable: true })
  oppDna: string;

  @Field()
  scenario: string; // will be either `Opportunity` or `BuyingEvent`

  @Field((type) => [Applet], { nullable: "items" }) // an empty array [] is a valid return
  statuses: Applet[];
}

@ObjectType()
export class Applet {
  @Field()
  key: string;
  @Field()
  status: number;
}

**Generated Schema**
type Status {
  cbeDna: ID
  oppDna: String
  scenario: String!
  statuses: [Applet]!
}

type Applet {
  key: String!
  status: Float!
}

type Query {
  getStatuses: [Status!]!
  triggerPubSub: String!
}

type Subscription {
  statusUpdated(cbeDna: String, oppDna: String): Status!
}

**mock-fe**
const COMMENTS_SUBSCRIPTION = gql`
subscription Subscription($cbeDna: String, $oppDna: String) {
  statusUpdated(cbeDna: $cbeDna, oppDna: $oppDna) {
    cbeDna
    oppDna
    scenario
    statuses {
      status
      key
    }
  }
}
`;
