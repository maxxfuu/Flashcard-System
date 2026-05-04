const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'

export async function apiFetch(path, options = {}, token) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}
