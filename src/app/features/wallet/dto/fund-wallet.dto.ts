import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
