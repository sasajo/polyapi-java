import axios from 'axios';
import { POLY_HEADER_API_KEY } from './constants';
import { FunctionDto } from '@poly/common';

export const getPolyFunctions = async () => {
  return (
    await axios.get<FunctionDto[]>(
      `${process.env.POLY_API_BASE_URL}/function`,
      {
        headers: {
          'Content-Type': 'application/json',
          [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
        },
      },
    )
  ).data;
};
