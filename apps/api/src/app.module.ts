import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { PropertiesModule } from './properties/properties.module';

const databaseUrl = process.env.DATABASE_URL;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(databaseUrl
      ? [
          TypeOrmModule.forRoot({
            type: 'postgres' as const,
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: process.env.TYPEORM_SYNC === 'true',
          }),
        ]
      : []),
    PropertiesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
