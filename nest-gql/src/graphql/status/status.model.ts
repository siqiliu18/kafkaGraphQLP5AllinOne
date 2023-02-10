import { Field, ID, ObjectType } from '@nestjs/graphql';

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

// spec of payload we get from Kafka
export type StatusEvent = {
  CbeDNA: string;
  OppDNA: string;
  Scenario: string;
  RequestID: string;
  Namespace: string;
  Statuses: { UniqueKey: string; StatusCode: number }[];
};