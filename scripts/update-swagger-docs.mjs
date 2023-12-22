import 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const updateSwaggerDocs = async () => {
  try {
    const port = process.env.PORT || 8000;

    const publicDocumentResponse = await axios.get(`http://localhost:${port}/swagger-json`);

    const internalDocumentResponse = await axios.get(`http://localhost:${port}/swagger-internal-json`);

    fs.writeFileSync(
      path.join(dirname(fileURLToPath(import.meta.url)), '../swagger.json'),
      JSON.stringify(publicDocumentResponse.data),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(dirname(fileURLToPath(import.meta.url)), '../swagger-internal.json'),
      JSON.stringify(internalDocumentResponse.data),
      'utf-8',
    );

    console.log(chalk.green('Updated swagger docs.'));
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn(
        chalk.yellow('Failed to update swagger docs, please turn on your server if you want to update them.'),
      );
    } else {
      console.err(chalk.red('Failed to update swagger docs.'));
    }
  }
};

updateSwaggerDocs();
