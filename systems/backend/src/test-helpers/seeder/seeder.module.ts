import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameEntity } from '../../game-gallery/models/game.entity';
import { SeederController } from './seeder.controller';
import { SeederService } from './seeder.service';

@Module({
  controllers: [SeederController],
  imports: [TypeOrmModule.forFeature([GameEntity])],
  providers: [SeederService],
})
export class SeederModule {}
