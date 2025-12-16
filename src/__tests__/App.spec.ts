import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, afterEach } from 'vitest'

import App from '../App.vue'

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders camera cards with active roll details', async () => {
    const responses = [
      [
        { id: 1, model: 'Pentax K1000', supported_film_type: '35mm' },
        { id: 2, model: 'Hasselblad 500', supported_film_type: '120' },
      ],
      [
        { id: 10, name: 'Portra 400', iso: 400, format: '35mm', expiration_date: '2030-01-01' },
        { id: 11, name: 'HP5', iso: 400, format: '120', expiration_date: '2030-01-01' },
      ],
      [
        {
          id: 99,
          camera_id: 1,
          film_type_id: 10,
          load_date: '2024-01-10',
          end_date: null,
          model: 'Pentax K1000',
          film_name: 'Portra 400',
          iso: 400,
          expiration_date: '2030-01-01',
        },
      ],
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => responses.shift(),
      })) as unknown as typeof fetch,
    )

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.text()).toContain('Film Roll Tracker')
    expect(wrapper.text()).toContain('Pentax K1000')
    expect(wrapper.text()).toContain('Portra 400')
  })
})
