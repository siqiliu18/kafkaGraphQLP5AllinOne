import { Module } from "@nestjs/common";
import { StatusModule } from "src/graphql/status/status.module";
import { StatusConsumerService } from "./consumer.service";

@Module({
    imports: [StatusModule],
    providers: [StatusConsumerService],
})

export class KafkaStatusConsumerModule { }