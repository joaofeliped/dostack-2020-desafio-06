import csv from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';

interface Request {
  file: Express.Multer.File;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const transactionsCsv = await this.readFile({ file });

    console.log(transactionsCsv);
  }

  private async readFile({ file }: Request): Promise<string[]> {
    const readCSVStream = fs.createReadStream(file.path);

    const parseStream = csv({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: string[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }
}

export default ImportTransactionsService;
