import { Module } from '@nestjs/common';
import { PubSub } from "graphql-subscriptions"
import { StatusResolver } from './status.resolver';

@Module({
  providers: [
    StatusResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [
    StatusResolver,
  ]
})

export class StatusModule { }
