import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';

// Mock the DatabaseService (which acts as PrismaClient)
const mockDatabaseService = {
  wallet: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockDatabaseService)),
};

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transfer', () => {
    const senderId = 'sender-uuid';
    const receiverId = 'receiver-uuid';

    it('should throw error if transferring to self', async () => {
      await expect(
        service.transfer(senderId, { receiverId: senderId, amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if sender not found', async () => {
      mockDatabaseService.wallet.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.transfer(senderId, { receiverId, amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if insufficient balance', async () => {
      mockDatabaseService.wallet.findUnique.mockResolvedValueOnce({
        id: senderId,
        balance: 50,
      });

      await expect(
        service.transfer(senderId, { receiverId, amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully transfer funds', async () => {
      // 1. Mock Sender (Balance 200)
      mockDatabaseService.wallet.findUnique.mockResolvedValueOnce({
        id: senderId,
        balance: 200,
      });
      // 2. Mock Receiver
      mockDatabaseService.wallet.findUnique.mockResolvedValueOnce({
        id: receiverId,
        balance: 0,
      });
      // 3. Mock Transaction
      mockDatabaseService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        status: 'SUCCESS',
      });

      const result = await service.transfer(senderId, {
        receiverId,
        amount: 100,
      });

      expect(result).toHaveProperty('message', 'Transfer successful');

      // Verify updates
      expect(mockDatabaseService.wallet.update).toHaveBeenCalledWith({
        where: { id: senderId },
        data: { balance: { decrement: 100 } },
      });
      expect(mockDatabaseService.wallet.update).toHaveBeenCalledWith({
        where: { id: receiverId },
        data: { balance: { increment: 100 } },
      });
    });
  });
});
