import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { KafkaPubSub } from 'graphql-kafkajs-subscriptions';
import { Status } from './status.model';

@Resolver(() => Status)
export class StatusResolver {
  constructor(@Inject('PUB_SUB') private pubsub: KafkaPubSub) {}

  private statuses: Status[] = [
    new Status(1, 'Not Started'),
    new Status(2, 'In Progress'),
    new Status(3, 'Completed'),
  ];

  @Query(() => [Status])
  getStatuses(): Status[] {
    console.log('?', this.statuses);
    return this.statuses;
  }

  @Mutation(() => Status)
  addStatus(@Args('newStatusStr') newStatusStr: string): Status {
    const newStatus = new Status(this.statuses.length + 1, newStatusStr);
    this.statuses.push(newStatus);
    return newStatus;
  }

  @Subscription(() => Status, {
    resolve: (payload): Status => {
      const { id, status } = JSON.parse(payload.value.toString());
      console.log("id: ", id);
      console.log("status: ", status);
      return new Status(id, status);
    },
    filter: (payload, variable) => {
      const { id, status } = JSON.parse(payload.value.toString());
      return id === variable.ID;
    },
  })
  getStatus(@Args('ID', { nullable: true }) ID: number) {
    return this.pubsub.asyncIterator('topic-status');
  }
}
