import csv from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  file: Express.Multer.File;
}

interface ResponseTransaction {
  transactionsData: string[];
  categories: string[];
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  categoryTitle: string;
}

interface SplitTransaction {
  incomes: TransactionDTO[];
  outcomes: TransactionDTO[];
}

class ImportTransactionsService {
  private createTransaction: CreateTransactionService;

  private createCategory: CreateCategoryService;

  constructor(
    createTransaction: CreateTransactionService,
    createCategory: CreateCategoryService,
  ) {
    this.createTransaction = createTransaction;
    this.createCategory = createCategory;
  }

  async execute({ file }: Request): Promise<Transaction[]> {
    const transactionsResponseCsv = await this.readFile({ file });

    const { transactionsData, categories } = transactionsResponseCsv;

    const nonDuplicatesCategories = categories.reduce(
      (accumulator: string[], category: string) =>
        accumulator.includes(category)
          ? accumulator
          : [...accumulator, category],
      [],
    );

    await Promise.all(
      nonDuplicatesCategories.map(async category => {
        const newCategory = await this.createCategory.execute({
          title: category,
        });

        return newCategory;
      }),
    );

    const splitTransaction = transactionsData.reduce(
      (accumulator: SplitTransaction, transactionData: string) => {
        const type = transactionData[1] === 'income' ? 'income' : 'outcome';

        const transaction: TransactionDTO = {
          title: transactionData[0],
          type,
          value: Number.parseFloat(transactionData[2]),
          categoryTitle: transactionData[3],
        };

        switch (transaction.type) {
          case 'income':
            accumulator.incomes.push(transaction);
            break;
          case 'outcome':
            accumulator.outcomes.push(transaction);
            break;
          default:
            break;
        }

        return accumulator;
      },
      { incomes: [], outcomes: [] },
    );

    const incomes = await Promise.all(
      splitTransaction.incomes.map(async transactionDTO => {
        const transaction = await this.createTransaction.execute(
          transactionDTO,
        );

        return transaction;
      }),
    );

    const outcomes = await Promise.all(
      splitTransaction.outcomes.map(async transactionDTO => {
        const transaction = await this.createTransaction.execute(
          transactionDTO,
        );

        return transaction;
      }),
    );

    const transactions = [...incomes, ...outcomes];

    const fileExists = await fs.promises.stat(file.path);

    if (fileExists) {
      await fs.promises.unlink(file.path);
    }

    return transactions;
  }

  private async readFile({ file }: Request): Promise<ResponseTransaction> {
    const readCSVStream = fs.createReadStream(file.path);

    const parseStream = csv({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsData: string[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      transactionsData.push(line);
      categories.push(line[3]);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const response: ResponseTransaction = {
      transactionsData,
      categories,
    };

    return response;
  }
}

export default ImportTransactionsService;
