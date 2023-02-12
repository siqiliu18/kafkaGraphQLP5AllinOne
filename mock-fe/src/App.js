import { useState } from "react";
import axios from "axios";
import Box from "@material-ui/core/Box";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useSubscription,
  gql,
  split,
  HttpLink,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";
import { TableCell, TableRow } from "@material-ui/core";

// import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
// import { createClient } from "graphql-ws";

const httpLink = new HttpLink({
  uri: "http://localhost:4981/graphql",
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4981/graphql`,
  options: {
    reconnect: true,
  },
});

// const wsLink = new GraphQLWsLink(
//   createClient({
//     url: "ws://localhost:4981/subscriptions",
//   })
// );

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

const COMMENTS_SUBSCRIPTION = gql`
subscription Subscription($cbeDna: String, $oppDna: String) {
  statusUpdated(cbeDna: $cbeDna, oppDna: $oppDna) {
    cbeDna
    oppDna
    scenario
    statuses {
      key
      status
    }
  }
}
`;

function LatestComment({ cbeDNA, oppDNA }) {
  const { data } = useSubscription(COMMENTS_SUBSCRIPTION, {
    variables: { cbeDna: cbeDNA, oppDna: oppDNA },
  });
  let status = 2;
  if (!!data) {
    const txTypeCdApplet = data.statusUpdated.statuses.find(item => item.key === "COACHINGCLIENTBEDESC")
    console.log("txTypeCdApplet shouldbe COACHINGCLIENTDESC: ", txTypeCdApplet);
    status = txTypeCdApplet.status;
  }
  return <TableCell>{status}</TableCell>;
}

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
    <div style={{ marginLeft: "20px", marginTop: "20px" }}>
      <Box border={1} height={250} width={600}>
        <TableRow>
          <LatestComment oppDNA="23020321Pct2PuB" cbeDNA="G210212Aydi" />
          <TableCell>Client Buying Event Description</TableCell>
        </TableRow>
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Overall Opportunity:
              <div>
                <input
                  type="text"
                  value={state.OverallOpp}
                  onChange={(e) =>
                    stateSet({ ...state, OverallOpp: e.target.value })
                  }
                  style={{ height: "40px", width: "90%" }}
                />
              </div>
            </label>
          </div>
          <div>
            <label>
              Delivery & Service Timelines:
              <div>
                <input
                  type="text"
                  value={state.DelServTimeline}
                  onChange={(e) =>
                    stateSet({ ...state, DelServTimeline: e.target.value })
                  }
                  style={{ height: "40px", width: "90%" }}
                />
              </div>
            </label>
          </div>
          <input type="submit" value="Submit" />
        </form>
      </Box>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Applet />
    </ApolloProvider>
  );
}

export default App;
