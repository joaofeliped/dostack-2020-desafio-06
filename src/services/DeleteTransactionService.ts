import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne({
      where: {
        id,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.type === 'income') {
      const balance = await transactionsRepository.getBalance();

      if (balance.total - transaction.value < 0) {
        throw new AppError(
          'Cannot delete income transaction because total balance will be less than 0',
        );
      }
    }

    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
