/**
 * Smart-Call API Client
 *
 * Thin HTTP wrapper over the Smart-Call External API.
 * All methods return parsed JSON; errors throw with status + message.
 */

export interface SmartCallClientConfig {
  apiKey: string
  baseUrl: string
  /** Request timeout in ms, default 30000 */
  timeout?: number
}

export class SmartCallClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: SmartCallClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.timeout = config.timeout ?? 30_000
  }

  // ── Auth ──────────────────────────────────────────────

  async verifyAuth(): Promise<any> {
    return this.get('/api/v1/external/auth/verify')
  }

  // ── Leads ─────────────────────────────────────────────

  async pushLead(params: {
    programId: string
    phone: string
    variables?: Record<string, any>
  }): Promise<any> {
    return this.post('/api/v1/external/leads', params)
  }

  async queryLead(params: {
    threadId?: string
    programId?: string
    phone?: string
  }): Promise<any> {
    const qs = new URLSearchParams()
    if (params.threadId) qs.set('threadId', params.threadId)
    if (params.programId) qs.set('programId', params.programId)
    if (params.phone) qs.set('phone', params.phone)
    return this.get(`/api/v1/external/leads?${qs.toString()}`)
  }

  async batchQueryLeads(params: {
    threadIds?: string[]
    programId?: string
    date?: string
    page?: number
    pageSize?: number
  }): Promise<any> {
    const qs = new URLSearchParams()
    if (params.threadIds?.length) qs.set('threadIds', params.threadIds.join(','))
    if (params.programId) qs.set('programId', params.programId)
    if (params.date) qs.set('date', params.date)
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    return this.get(`/api/v1/external/leads/batch?${qs.toString()}`)
  }

  // ── Programs ──────────────────────────────────────────

  async listPrograms(params?: {
    runState?: 'RUNNING' | 'PAUSED'
    page?: number
    pageSize?: number
  }): Promise<any> {
    const qs = new URLSearchParams()
    if (params?.runState) qs.set('runState', params.runState)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const query = qs.toString()
    return this.get(`/api/v1/external/programs${query ? `?${query}` : ''}`)
  }

  async controlProgram(programId: string, action: 'start' | 'pause'): Promise<any> {
    return this.post(`/api/v1/external/programs/${programId}/run-state`, { action })
  }

  async getProgramStats(programId: string, params?: { date?: string }): Promise<any> {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    const query = qs.toString()
    return this.get(`/api/v1/external/programs/${programId}/stats${query ? `?${query}` : ''}`)
  }

  async getDialingConfig(programId: string): Promise<any> {
    return this.get(`/api/v1/external/programs/${programId}/dialing-config`)
  }

  async updateDialingConfig(programId: string, config: {
    maxConcurrency?: number
    priorityStrategy?: 'LIFO' | 'FIFO'
    workTimeConfig?: any
    blockStartTime?: number | null
    blockEndTime?: number | null
  }): Promise<any> {
    return this.put(`/api/v1/external/programs/${programId}/dialing-config`, config)
  }

  // ── Bots ──────────────────────────────────────────────

  async listBots(programId: string): Promise<any> {
    return this.get(`/api/v1/external/programs/${programId}/bots`)
  }

  async getBotScript(botId: string): Promise<any> {
    return this.get(`/api/v1/external/bots/${botId}/script`)
  }

  async updateBotScript(botId: string, prompt: string): Promise<any> {
    return this.put(`/api/v1/external/bots/${botId}/script`, { prompt })
  }

  // ── Webhook ────────────────────────────────────────────

  async getWebhook(programId: string): Promise<any> {
    return this.get(`/api/v1/external/programs/${programId}/webhook`)
  }

  async updateWebhook(programId: string, config: {
    webhookUrl?: string | null
    webhookSecret?: string | null
  }): Promise<any> {
    return this.put(`/api/v1/external/programs/${programId}/webhook`, config)
  }

  // ── Lead Upload ───────────────────────────────────────

  async downloadLeadTemplate(programId: string, botId?: string): Promise<any> {
    const qs = botId ? `?botId=${botId}` : ''
    return this.get(`/api/v1/external/programs/${programId}/leads/template${qs}`)
  }

  // ── HTTP helpers ──────────────────────────────────────

  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'smartcall-agent-toolkit/0.1.0',
    }

    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    }

    if (body) {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }

    const res = await fetch(url, init)
    const data: any = await res.json()

    if (!res.ok) {
      const msg = data?.msg || data?.message || res.statusText
      throw new Error(`Smart-Call API error ${res.status}: ${msg}`)
    }

    return data
  }

  private get(path: string) {
    return this.request('GET', path)
  }

  private post(path: string, body: any) {
    return this.request('POST', path, body)
  }

  private put(path: string, body: any) {
    return this.request('PUT', path, body)
  }
}
