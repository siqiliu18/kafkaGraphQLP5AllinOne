import { Module } from '@nestjs/common';
import { KafkaPubSub } from 'graphql-kafkajs-subscriptions';
import { Kafka } from 'kafkajs';
import { StatusResolver } from './status.resolver';

@Module({
  providers: [
    StatusResolver,
    {
      provide: 'PUB_SUB',
      useValue: KafkaPubSub.create({
        kafka: new Kafka({
          brokers: ['localhost:9093', 'localhost:9093', 'localhost:9093'],
        }),
        topic: 'topic-status',
        groupIdPrefix: 'demo1',
      }),
    },
  ],
})
export class StatusModule {}
