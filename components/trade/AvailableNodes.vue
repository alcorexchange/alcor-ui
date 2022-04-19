<template lang="pug">
// available nodes element
.available-nodes(v-loading='loading')
  .nodes-list.d-flex.flex-column(v-for='item in node_items')
    .node-info.d-flex.flex-row.justify-content-between
      .node-name-link.gap-2.pb-2
        .node-name.pb-2 {{ item.node_name }}
        .node-link.pb-2 {{ item.node_link }}
      .node-time.standard(v-if='item.node_time < 1') {{ Number((item.node_time * 1000).toFixed(1)) }}ms
      .node-time.warning(v-else='') {{ item.node_time }}s
      .node-status
        img.logo(height='44', src='~/assets/logos/nodeinactive.svg', alt='')
</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
      loading: false,
      node_items: [
        {
          node_name: 'Finland - Finland - Helsinki',
          node_link: 'wss://node.graphenelab.io',
          node_time: '0.4946',
        },
        {
          node_name: 'Finland - Finland - Helsinki',
          node_link: 'wss://gph.lexal.io',
          node_time: '0.5235',
        },
        {
          node_name: 'Finland - Finland - Helsinki',
          node_link: 'wss://gph-api.xching.finance',
          node_time: '0.6603',
        },
        {
          node_name: 'Estern Asia - China - Hong-Kong',
          node_link: 'wss://node.hk.graphene.fans',
          node_time: '1.23',
        },
      ],
    }
  },
  computed: {
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapState('settings', ['timesAndSales']),
    ...mapState(['network']),
  },
  mounted() {},
  methods: {},
}
</script>

<style lang="scss">
.available-nodes {
}

.node-name {
  font-size: 14px;
  color: #f2f2f2;
}

.node-link {
  font-size: 10px;
  color: #bdbdbd;
}

.node-time {
  font-size: 12px;
  &.standard {
    color: #d0da59;
  }
  &.warning {
    color: #f96c6c;
  }
}
.node-status img {
  width: 10px;
  height: 10px;
}
</style>
