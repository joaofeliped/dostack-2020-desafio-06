import { getRepository } from 'typeorm';
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
  private createCategoryService: CreateCategoryService;

  private transactionsRepository: TransactionsRepository;

  constructor(
    transactionsRepository: TransactionsRepository,
    createCategoryService: CreateCategoryService,
  ) {
    this.transactionsRepository = transactionsRepository;
    this.createCategoryService = createCategoryService;
  }

  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const category = await this.createCategoryService.execute({
      title: categoryTitle,
    });

    const tran = getRepository(Transaction);

    // if (type === 'outcome') {
    //   const balance = await this.transactionsRepository.getBalance();
    //   if (value > balance.total) {
    //     throw new AppError(
    //       'Value form transaction type outcome cannot be greater than total balance.',
    //     );
    //   }
    // }

    const transaction = tran.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await tran.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
