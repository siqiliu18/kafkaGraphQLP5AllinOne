import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatusModule } from './graphql/status/status.module';
import { KafkaStatusConsumerModule } from './kafka-consumer/status/consumer.module';
import { StatusConsumerService } from './kafka-consumer/status/consumer.service';

@Module({
  imports: [
    StatusModule,
    KafkaStatusConsumerModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      subscriptions: {
        'subscriptions-transport-ws': {
          path: '/graphql',
        },
      },
      autoSchemaFile: 'src/schema.gql',
      installSubscriptionHandlers: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, StatusConsumerService],
})

export class AppModule { }
