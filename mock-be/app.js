const Chance = require("chance");
const express = require("express");
const { Kafka } = require("kafkajs");
const cors = require("cors");

const kafka = new Kafka({
  clientId: "my-app-demo",
  brokers: ["localhost:9093", "localhost:9094", "localhost:9095"],
});

const producer = kafka.producer();
// const consumer = kafka.consumer({ groupId: 'test-group' })

const chance = new Chance();

const producerMessage = async (value) => {
  // const value = chance.animal();
  await producer.send({
    topic: "topic-status",
    messages: [{ value }],
  });
};

const run = async (value) => {
  // Producing
  await producer.connect();
  producerMessage(value);
};

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/status", (req, res) => {
  res.json({ message: "Hello from server!" });
});
app.post("/status", (req, res) => {
  let firstBox = req.body.OverallOpp;
  console.log(firstBox);
  let secondBox = req.body.DelServTimeline;
  console.log(secondBox);
  let statusRes = "";
  if (firstBox === "" && secondBox === "") {
    console.log("Not Started");
    statusRes = "Not Started";
  } else if (firstBox !== "" && secondBox !== "") {
    console.log("Completed");
    statusRes = "Completed";
  } else {
    console.log("In Progress");
    statusRes = "In Progress";
  }

  const obj = { id: req.body.id, status: statusRes };
  const jsonStr = JSON.stringify(obj);
  console.log("???", jsonStr);

  run(jsonStr).catch(console.error);
});

const PORT = 4982;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
