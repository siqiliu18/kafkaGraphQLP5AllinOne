import { useState, useRef } from "react";
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
import requiredNotStartedIcon from "./img/updatedStatus-requiredNotStarted.svg";
import partiallyCompleteIcon from "./img/updatedStatus-partiallyComplete.svg";
import fullyCompleteIcon from "./img/updatedStatus-fullyComplete.svg";
import notApplicableIcon from "./img/updatedStatus-notApplicable.svg";
import "./App.css";

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
  subscription Subscription($id: Float) {
    getStatus(ID: $id) {
      id
      status
    }
  }
`;

function LatestComment({ id }) {
  const { data } = useSubscription(COMMENTS_SUBSCRIPTION, {
    variables: { id },
  });
  let status = "Not Started";
  if (!!data) {
    status = data.getStatus.status;
  }

  if (status === "Not Started") {
    return (
      <img
        className="img-class"
        src={requiredNotStartedIcon}
        alt="requiredNotStartedIcon"
        style={{ width: "15px", marginLeft: "5px" }}
      />
    );
  } else if (status === "In Progress") {
    return (
      <img
        className="img-class"
        src={partiallyCompleteIcon}
        alt="partiallyCompleteIcon"
        style={{ width: "15px", marginLeft: "5px" }}
      />
    );
  } else if (status === "Completed") {
    return (
      <img
        className="img-class"
        src={fullyCompleteIcon}
        alt="fullyCompleteIcon"
        style={{ width: "15px", marginLeft: "5px" }}
      />
    );
  }

  return (
    <img
      src={notApplicableIcon}
      alt="notApplicableIcon"
      style={{ width: "15px" }}
    />
  );
}

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

function App() {
  return (
    <ApolloProvider client={client}>
      <Applet />
    </ApolloProvider>
  );
}

export default App;
