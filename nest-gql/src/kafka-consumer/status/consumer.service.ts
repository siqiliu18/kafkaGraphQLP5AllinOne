import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { Consumer, ConsumerRunConfig, ConsumerSubscribeTopic, Kafka } from "kafkajs";
import { StatusResolver } from "src/graphql/status/status.resolver";

@Injectable()
export class StatusConsumerService implements OnApplicationShutdown, OnModuleInit {
    constructor(private readonly statusResolver: StatusResolver) { }

    private readonly kafka = new Kafka({
        brokers: ['localhost:9093', 'localhost:9094', 'localhost:9095'],
    })

    private readonly consumers: Consumer[] = [];

    async consume(topic: ConsumerSubscribeTopic, config: ConsumerRunConfig) {
        const consumer = this.kafka.consumer({
            groupId: 'consumer-group-2',
        })
        await consumer.connect();
        await consumer.subscribe(topic);
        await consumer.run(config);
        this.consumers.push(consumer);
    }

    async onApplicationShutdown(signal?: string) {
        for (const consumer of this.consumers) {
            await consumer.disconnect();
        }
    }

    async onModuleInit() {
        await this.consume(
            { topic: 'topic-status' },
            {
                eachMessage: async ({ topic, partition, message }) => {
                    const latestStatusStr = message.value.toString();
                    console.log("Kafka Payload: ", message);
                    this.statusResolver.triggerPubSub(latestStatusStr);
                    console.log({
                        value: message.value.toString(),
                        topic: topic.toString(),
                        partition: partition.toString(),
                    });
                }
            }
        )
    }
}