import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Applet, Status, StatusEvent } from './status.model';

@Resolver(() => Status)
export class StatusResolver {
  constructor(@Inject('PUB_SUB') private pubsub: PubSub) { }

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

  // @Subscription(() => Status, {
  //   resolve: (payload): Status => {
  //     const { id, status } = JSON.parse(payload.value.toString());
  //     console.log("id: ", id);
  //     console.log("status: ", status);
  //     return new Status(id, status);
  //   },
  //   filter: (payload, variable) => {
  //     const { id, status } = JSON.parse(payload.value.toString());
  //     return id === variable.ID;
  //   },
  // })
  // getStatus(@Args('ID', { nullable: true }) ID: number) {
  //   return this.pubsub.asyncIterator('topic-status');
  // }

  @Query(() => String)
  async triggerPubSub(msg: string) {
    console.log("triggerPubSub.publish: ", msg);
    this.pubsub.publish('toStatusSub', {
      statusUpdated: msg,
    })
    return "sent";
  }

  @Subscription(() => Status, {
    resolve: payload => {
      console.log("Status Subscription payload: ", payload.statusUpdated);
      const event: StatusEvent = JSON.parse(payload.statusUpdated);
      const out: Status = {
        cbeDna: event.CbeDNA,
        oppDna: event.OppDNA,
        scenario: event.Scenario,
        statuses: event.Statuses ? event.Statuses.map((item) => {
          return { key: item.UniqueKey, status: item.StatusCode };
        }) : [],
      }
      return out;
    },
    filter: (
      payload,
      variables,
    ) => {
      console.log(">>>>>> In filter: ", payload);
      const event: StatusEvent = JSON.parse(payload.statusUpdated);
      return event.CbeDNA == variables.cbeDna;
    }
  })
  statusUpdated(
    @Args("cbeDna", { nullable: true }) cbeDna: string,
    @Args("oppDna", { nullable: true }) oppDna: string,
  ) {
    return this.pubsub.asyncIterator('toStatusSub');
  }
}
