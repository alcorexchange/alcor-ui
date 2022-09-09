export const actions = {
  async updatePhoto({ dispatch, rootState }, { photo_hash }) {
    const actions = [{
      account: 'wax.gg',
      name: 'updatephoto',
      authorization: [rootState.user.authorization],
      data: {
        account: rootState.user.name,
        photo_hash
      }
    }]
    return await dispatch('chain/sendTransaction', actions, { root: true })
  },
  async getPhotoHash({ rootState }, accountName) {
    const { rows } = await this.$rpc.get_table_rows({
      code: 'wax.gg',
      scope: 'wax.gg',
      table: 'photos',
      json: true,
      limit: 1,
      lower_bound: accountName || rootState.user.name,
      upper_bound: accountName || rootState.user.name
    })

    return rows[0]?.photo_hash || null
  },
  async getFriendList({ rootState }) {
    const { rows } = await this.$rpc.get_table_rows({
      code: 'atomhubtools',
      json: true,
      limit: 1000,
      lower_bound: 'friends',
      scope: rootState.user.name,
      scope_type: 'name',
      table: 'acclists',
      upper_bound: 'friends'
    })

    return rows[0].list
  }
}
