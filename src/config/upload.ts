import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const pathTmp = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: pathTmp,
  storage: multer.diskStorage({
    destination: pathTmp,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
