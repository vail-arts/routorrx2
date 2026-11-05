import type {ServiceMap} from '@/types/api';
import {record,validResponse} from './validation';

const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

export async function requestJSON(
  path: string, 
  body: unknown, 
  signal?: AbortSignal, 
  credentials: RequestCredentials = 'same-origin'
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${base}/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      credentials
    });
  } catch (error) {
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error('Unable to reach the service. Check your connection and try again.');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('The service returned an unreadable response. Please try later.');
  }

  if (!response.ok) {
    throw new Error(record(data) && typeof data.error === 'string' ? data.error.slice(0, 500) : 'Service unavailable. Please try again.');
  }
  return data;
}

export async function api<K extends keyof ServiceMap>(
  service: K, 
  body: ServiceMap[K]['request'], 
  signal?: AbortSignal
): Promise<ServiceMap[K]['response']> {
  const data = await requestJSON(service, body, signal);
  if (!validResponse(service, data)) {
    throw new Error('The service returned invalid data. Please try again later.');
  }
  return data as ServiceMap[K]['response'];
}