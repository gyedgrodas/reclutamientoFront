export const state = () => ({
  token: null,
  user: null,
  roles: [],
})

export const mutations = {
  setToken(Newstate, token) {
    Newstate.token = token
  },
  setUser(Newstate, user) {
    Newstate.user = user
  },
  setRoles(Newstate, roles) {
    Newstate.roles = roles
  },
}
export const actions = {
  async login({ commit }, credentials) {
    const response = await this.$axios.post('/api/auth/login', credentials)

    // Guardar el token, el usuario y los roles
    commit('setToken', response.data.token)
    commit('setUser', response.data.user)
    commit('setRoles', response.data.roles)
  },

  async logout({ commit }) {
    await this.$axios.post('/api/auth/logout')
    commit('setToken', null)
    commit('setUser', null)
    commit('setRoles', [])
  },
}
