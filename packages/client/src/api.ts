import axios from 'axios';
import {
  HEADER_ACCEPT_FUNCTION_DEFINITION,
  HEADER_ACCEPT_WEBHOOK_HANDLE_DEFINITION,
  POLY_HEADER_API_KEY,
} from './constants';
import { FunctionDefinitionDto, Specification, WebhookHandleDefinitionDto } from '@poly/common';

export const getSpecs = async (contexts?: string[], names?: string[], ids?: string[]) => {
  return (
    await axios.get<Specification[]>(`${process.env.POLY_API_BASE_URL}/specs`, {
      headers: {
        [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
      },
      params: {
        contexts,
        names,
        ids
      }
    })
  ).data;
};

export const getFunctions = async (contexts?: string[], names?: string[], ids?: string[]) => {
  return (
    await axios.get<FunctionDefinitionDto[]>(`${process.env.POLY_API_BASE_URL}/functions`, {
      headers: {
        Accept: HEADER_ACCEPT_FUNCTION_DEFINITION,
        [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
      },
      params: {
        contexts,
        names,
        ids,
      },
    })
  ).data;
};

export const getWebhookHandles = async (contexts?: string[], names?: string[], ids?: string[]) => {
  return (
    await axios.get<WebhookHandleDefinitionDto[]>(`${process.env.POLY_API_BASE_URL}/webhooks`, {
      headers: {
        Accept: HEADER_ACCEPT_WEBHOOK_HANDLE_DEFINITION,
        [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
      },
      params: {
        contexts,
        names,
        ids,
      },
    })
  ).data;
};

export const createServerFunction = async (context: string | null, name: string, code: string) => {
  return (
    await axios.post(
      `${process.env.POLY_API_BASE_URL}/functions/server`,
      {
        context,
        name,
        code,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
        },
      },
    )
  ).data;
};

export const createClientFunction = async (context: string | null, name: string, code: string) => {
  return (
    await axios.post(
      `${process.env.POLY_API_BASE_URL}/functions/client`,
      {
        context,
        name,
        code,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          [POLY_HEADER_API_KEY]: process.env.POLY_API_KEY || '',
        },
      },
    )
  ).data;
};
