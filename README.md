# kafkaGraphQLP5AllinOne

## The programs are using local kafka AKHQ server

## master branch:

1. nest-gql: a nestjs program uses KafkaPubSub from graphql-kafkajs-subscriptions library.
2. mock-be: a nodejs program that provides an REST API and uses kafkajs to produce messages to a topic.
3. mock-fe: a react program that sends requests to mock-be's API and subscribes to graphql socket.

**Note**:

1. The parameter of subscription in mock-fe is _Float_ because of nestjs graphQL id is **_number_** type.
2. The graphql-kafkajs-subscriptions library is bad because it created random suffix for consumer group where makes it impossible to scale up consumers within a group.

## nodejs-graphql-kafkajs-combine

1. mock-gql: a nodejs program that uses KafkaPubSub from graphql-kafkajs-subscriptions library.
2. mock-be: a nodejs program that provides an REST API and uses kafkajs to produce messages to a topic.
3. mock-fe: a react program that sends requests to mock-be's API and subscribes to graphql socket.

**Note**:

1. The parameter of subscription in mock-fe is _Int_ because of mock-gql (nodejs) graphQL schema id is **_Int_** type.
2. The graphql-kafkajs-subscriptions library is bad because it created random suffix for consumer group where makes it impossible to scale up consumers within a group.

## nodejs-kafkajs-graphql-separate

**Schema First**

```
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
```

**mock-fe**

```
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
```

## nestjs-kafkajs-graphql-separate

**Code First**

```
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
```

**Generated Schema**

```
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
```

**mock-fe**

```
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
```

---

## Some React related notes

About expres post request
https://www.positronx.io/react-axios-tutorial-make-http-get-post-requests/ https://stackoverflow.com/questions/54952355/how-to-post-data-from-react-to-express https://stackoverflow.com/questions/51415439/how-can-i-add-raw-data-body-to-an-axios-request https://jasonwatmore.com/post/2020/02/01/react-fetch-http-post-request-examples

Downgrade react-script version < 5 to avoid webpack error?

Box
https://levelup.gitconnected.com/using-the-box-component-in-material-ui-to-easily-style-your-project-532894edd205 https://www.geeksforgeeks.org/how-to-use-box-component-in-reactjs/

graphQL
Must have the Query section https://stackoverflow.com/questions/54322029/graphqljs-query-root-type-must-be-provided

---

## Some nodejs backend related notes

Important link about header and cors https://stackoverflow.com/a/54952744

## React knowledges:

`Source:` https://www.youtube.com/watch?v=GGo3MVBFr1A
`As I only care about events after clicking the Submit button, there is no need to use useState which everytime I entered a char, the component will re-render. Use useRef to avoid unnecessary re-rendering.`

### Before - using useState

```
function Applet() {
  const [state, stateSet] = useState({
    OverallOpp: "",
    DelServTimeline: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    const userObject = {
      OverallOpp: state.OverallOpp,
      DelServTimeline: state.DelServTimeline,
    };

    console.log(userObject);

    axios({
      method: "post",
      url: "http://localhost:4982/status",
      headers: { "Content-Type": "application/json" },
      data: {
        id: 5,
        OverallOpp: state.OverallOpp,
        DelServTimeline: state.DelServTimeline,
      },
    });

    stateSet({
      OverallOpp: state.OverallOpp,
      DelServTimeline: state.DelServTimeline,
    });
  };

  return (
    <div className="container">
      <div className="table-name">
        <LatestComment id={5} />
        Client Buying Event Description
      </div>
      <form className="add-form" onSubmit={handleSubmit}>
        <div className="form-control">
          <label>Overall Opportunity:</label>
          <input
            type="text"
            value={state.OverallOpp}
            onChange={(e) => stateSet({ ...state, OverallOpp: e.target.value })}
            style={{ height: "40px", width: "90%" }}
          />
        </div>
        <div className="form-control">
          <label>Delivery & Service Timelines:</label>
          <input
            type="text"
            value={state.DelServTimeline}
            onChange={(e) =>
              stateSet({ ...state, DelServTimeline: e.target.value })
            }
            style={{ height: "40px", width: "90%" }}
          />
        </div>
        <input
          className="form-control-check btn"
          type="submit"
          value="Submit"
        />
      </form>
    </div>
  );
}
```

### After replacing useState with useRef - no need onChange, no need to re-render everytime entering a char into boxes.

```
function Applet() {
  const overallOpp = useRef("");
  const delServTimeline = useRef("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const userObject = {
      OverallOpp: overallOpp.current.value,
      DelServTimeline: delServTimeline.current.value,
    };

    console.log(userObject);

    axios({
      method: "post",
      url: "http://localhost:4982/status",
      headers: { "Content-Type": "application/json" },
      data: {
        id: 5,
        OverallOpp: overallOpp.current.value,
        DelServTimeline: delServTimeline.current.value,
      },
    });
  };

  return (
    <div className="container">
      <div className="table-name">
        <LatestComment id={5} />
        Client Buying Event Description
      </div>
      <form className="add-form" onSubmit={handleSubmit}>
        <div className="form-control">
          <label>Overall Opportunity:</label>
          <input
            ref={overallOpp}
            type="text"
            style={{ height: "40px", width: "90%" }}
          />
        </div>
        <div className="form-control">
          <label>Delivery & Service Timelines:</label>
          <input
            ref={delServTimeline}
            type="text"
            style={{ height: "40px", width: "90%" }}
          />
        </div>
        <input
          className="form-control-check btn"
          type="submit"
          value="Submit"
        />
      </form>
    </div>
  );
}
```
