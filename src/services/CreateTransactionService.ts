import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  private createCategory: CreateCategoryService;

  constructor(createCategory: CreateCategoryService) {
    this.createCategory = createCategory;
  }

  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const category = await this.createCategory.execute({
      title: categoryTitle,
    });

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();
      if (value > total) {
        throw new AppError(
          'Value form transaction type outcome cannot be greater than total balance.',
        );
      }
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
