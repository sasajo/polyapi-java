import axios from 'axios';
import {
  HEADER_ACCEPT_FUNCTION_DEFINITION,
  HEADER_ACCEPT_WEBHOOK_HANDLE_DEFINITION,
  POLY_HEADER_API_KEY,
} from './constants';
import { FunctionDefinitionDto, WebhookHandleDefinitionDto } from '@poly/common';

export const getPolyFunctions = async () => {
  return (
    await axios.get<FunctionDefinitionDto[]>(`${process.env.POLY_API_BASE_URL}/functions`, {
      headers: {
        Accept: HEADER_ACCEPT_FUNCTION_DEFINITION,
        [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
      },
    })
  ).data;
};

export const getWebhookHandles = async () => {
  return (
    await axios.get<WebhookHandleDefinitionDto[]>(`${process.env.POLY_API_BASE_URL}/webhooks`, {
      headers: {
        Accept: HEADER_ACCEPT_WEBHOOK_HANDLE_DEFINITION,
        [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
      },
    })
  ).data;
};
