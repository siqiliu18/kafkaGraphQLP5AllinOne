import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { KafkaPubSub } from 'graphql-kafkajs-subscriptions';
import { Status, Applet, StatusEvent } from './status.model';

@Resolver(() => Status)
export class StatusResolver {
  constructor(@Inject('PUB_SUB') private pubsub: KafkaPubSub) { }

  private applet1: Applet[] = [
    {
      key: "G1",
      status: 1
    },
  ]

  private statuses: Status[] = [
    {
      cbeDna: "CBE1",
      oppDna: "OPP1",
      scenario: "BE",
      statuses: this.applet1,
    }
  ];

  @Query(() => [Status])
  getStatuses(): Status[] {
    console.log('?', this.statuses);
    return this.statuses;
  }

  // @Mutation(() => Status)
  // addStatus(@Args('newStatusStr') newStatusStr: string): Status {
  //   const newStatus = new Status(this.statuses.length + 1, newStatusStr);
  //   this.statuses.push(newStatus);
  //   return newStatus;
  // }

  @Subscription(() => Status, {
    resolve: (payload): Status => {
      console.log("Payload.value: ", payload.value);
      const event: StatusEvent = JSON.parse(payload.value.toString());
      const out: Status = {
        cbeDna: event.CbeDNA,
        oppDna: event.OppDNA,
        scenario: event.Scenario,
        statuses: event.Statuses
          ? event.Statuses.map((item) => {
            return { key: item.UniqueKey, status: item.StatusCode };
          })
          : [],
      };

      console.log("Ouput: ", out);
      return out;
    },
    filter: (payload, variables) => {
      console.log(">>>>>> In filter - variables: ", variables);
      const event: StatusEvent = JSON.parse(payload.value.toString());
      console.log(">>>>>> In filter - payload: ", event);
      return event.CbeDNA == variables.cbeDna;
    },
  })
  statusUpdated(
    @Args("cbeDna", { nullable: true }) cbeDna: string,
    @Args("oppDna", { nullable: true }) oppDna: string,
  ) {
    return this.pubsub.asyncIterator('topic-status');
  }
}
