import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferFundsDto } from './dto/transfer-funds.dto';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.walletService.findOne(id);
  }

  @Post(':id/fund')
  fund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() fundWalletDto: FundWalletDto,
  ) {
    return this.walletService.fund(id, fundWalletDto);
  }

  @Post(':id/transfer')
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() transferFundsDto: TransferFundsDto,
  ) {
    return this.walletService.transfer(id, transferFundsDto);
  }
}
