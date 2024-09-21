// src/utils/fetchUtils.ts

import fetch, { RequestInit, Response } from 'node-fetch'

export interface FetchOptions extends RequestInit {
  retries?: number
  timeout?: number
}

export const fetchWithRetryAndTimeout = async <T>(
  url: string,
  options: FetchOptions = {},
  parser?: (response: Response) => Promise<T>
): Promise<T> => {
  const { retries = 3, timeout = 10000, ...fetchOptions } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions
      })

      clearTimeout(id)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
      }

      if (parser) {
        return await parser(response)
      }

      const contentType = response.headers.get('content-type')
      let data: T

      if (contentType && contentType.includes('application/json')) {
        data = (await response.json()) as T
      } else {
        data = (await response.text()) as T
      }

      return data
    } catch (error) {
      clearTimeout(id)
      if (attempt === retries) {
        if (error instanceof Error) {
          throw new Error(
            `Fetch failed for ${url} after ${retries} attempts: ${error.message}`
          )
        } else {
          throw new Error(
            `Fetch failed for ${url} after ${retries} attempts: ${String(
              error
            )}`
          )
        }
      }
      if (error instanceof Error) {
        console.warn(
          `Fetch attempt ${attempt} for ${url} failed: ${error.message}. Retrying in ${
            timeout / 1000
          } seconds...`
        )
      } else {
        console.warn(
          `Fetch attempt ${attempt} for ${url} failed: ${String(
            error
          )}. Retrying in ${timeout / 1000} seconds...`
        )
      }
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
  throw new Error(`Fetch failed for ${url} after ${retries} attempts.`)
}
