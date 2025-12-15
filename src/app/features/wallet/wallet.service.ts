import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferFundsDto } from './dto/transfer-funds.dto';
import { DatabaseService } from '../../../common/database/database.service';

@Injectable()
export class WalletService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createWalletDto: CreateWalletDto) {
    return {
      data: await this.databaseService.wallet.create({
        data: {
          currency: createWalletDto.currency,
          balance: 0,
        },
      }),
      message: 'Wallet created successfully',
    };
  }

  async findOne(id: string) {
    const wallet = await this.databaseService.wallet.findUnique({
      where: { id },
      include: {
        sentTransactions: true,
        receivedTransactions: true,
      },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');
    return { data: wallet, message: 'Wallet found' };
  }

  async fund(walletId: string, dto: FundWalletDto) {
    if (dto.idempotencyKey) {
      const existingTx = await this.databaseService.transaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingTx) return existingTx; // Return existing result without re-processing
    }

    return this.databaseService.$transaction(async (tx) => {
      // 1. Check wallet existence
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      // 2. Add Balance
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: dto.amount } },
      });

      // 3. Record Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: 'FUND',
          receiverWalletId: walletId,
          status: 'SUCCESS',
          idempotencyKey: dto.idempotencyKey,
        },
      });

      return {
        data: { wallet: updatedWallet, transaction },
        message: 'Wallet funding successful',
      };
    });
  }

  async transfer(senderId: string, dto: TransferFundsDto) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('Cannot transfer to self');
    }

    // Bonus: Check Idempotency
    if (dto.idempotencyKey) {
      const existingTx = await this.databaseService.transaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingTx) return existingTx;
    }

    return this.databaseService.$transaction(async (tx) => {
      // 1. Fetch Sender (with locking logic in real DB, here just fetch)
      const sender = await tx.wallet.findUnique({ where: { id: senderId } });
      if (!sender) throw new NotFoundException('Sender wallet not found');

      if (sender.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // 2. Fetch Receiver
      const receiver = await tx.wallet.findUnique({
        where: { id: dto.receiverId },
      });
      if (!receiver) throw new NotFoundException('Receiver wallet not found');

      // 3. Deduct from Sender
      await tx.wallet.update({
        where: { id: senderId },
        data: { balance: { decrement: dto.amount } },
      });

      // 4. Add to Receiver
      await tx.wallet.update({
        where: { id: dto.receiverId },
        data: { balance: { increment: dto.amount } },
      });

      // 5. Record Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: 'TRANSFER',
          senderWalletId: senderId,
          receiverWalletId: dto.receiverId,
          status: 'SUCCESS',
          idempotencyKey: dto.idempotencyKey,
        },
      });

      return { message: 'Transfer successful', data: transaction };
    });
  }
}
