import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Status {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: true })
  status: string;

  constructor(i: number, s: string) {
    this.id = i;
    this.status = s;
  }
}

export type StatusEvent = {
  id: number;
  status: string;
};
