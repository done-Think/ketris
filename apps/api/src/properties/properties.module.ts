import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { PropertyEntity } from './property.entity';

@Module({
  imports: [
    ...(process.env.DATABASE_URL ? [TypeOrmModule.forFeature([PropertyEntity])] : []),
  ],
  controllers: [PropertiesController],
})
export class PropertiesModule {}
