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
  },

  async addFriend({ rootState, dispatch }, accountName) {
    const actions = [
      {
        account: 'atomhubtools',
        name: 'addaccvalues',
        authorization: [rootState.user.authorization],
        data: {
          account: rootState.user.name,
          list_name: 'friends',
          values_to_add: [accountName]
        }
      }
    ]
    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  async removeFriend({ rootState, dispatch }, accountName) {
    const actions = [
      {
        account: 'atomhubtools',
        name: 'remaccvalues',
        authorization: [rootState.user.authorization],

        data: {
          account: rootState.user.name,
          list_name: 'friends',
          values_to_remove: [accountName]
        }
      }
    ]
    return await dispatch('chain/sendTransaction', actions, { root: true })
  },

  async blockUser({ rootState, dispatch }, accountName) {
    const actions = [
      {
        account: 'atomhubtools',
        name: 'addaccvalues',
        authorization: [rootState.user.authorization],

        data: {
          account: rootState.user.name,
          list_name: 'acc.blist',
          values_to_add: [accountName]
        }
      }
    ]
    return await dispatch('chain/sendTransaction', actions, { root: true })
  }

}
