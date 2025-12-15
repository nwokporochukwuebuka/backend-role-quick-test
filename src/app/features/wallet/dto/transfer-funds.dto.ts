import {
  IsNumber,
  Min,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class TransferFundsDto {
  @IsNotEmpty()
  @IsUUID()
  receiverId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
