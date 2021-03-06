import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from '../services/CreateCategoryService';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import multerConfig from '../config/upload';

const transactionsRouter = Router();
const upload = multer(multerConfig);

const createCategory = new CreateCategoryService();
const createTransaction = new CreateTransactionService(createCategory);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find();
  const balance = await transactionsRepository.getBalance();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    categoryTitle: category,
  });

  return response.status(201).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute({ id });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { file } = request;

    const importTransactions = new ImportTransactionsService(
      createTransaction,
      createCategory,
    );

    const transactions = await importTransactions.execute({ file });

    return response.status(201).json(transactions);
  },
);

export default transactionsRouter;
