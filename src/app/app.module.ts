import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/common/database/database.module';
import { WalletModule } from './features/wallet/wallet.module';

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
