<template lang="pug">
// available nodes element
.personal-nodes.d-flex.flex-column.gap-3(v-loading='loading')
  .nodes-list.d-flex.flex-column(v-for='item in node_items')
    .node-info.d-flex.flex-row.justify-content-between
      .node-name-link.gap-2.pb-2
        .node-name.pb-2 {{ item.node_name }}
        .node-link.pb-2 {{ item.node_link }}
      .node-time.personal-green(v-if='item.node_time < 1') {{ Number((item.node_time * 1000).toFixed(1)) }}ms
      .node-time.warning(v-else='') {{ item.node_time }}s
      .node-status
        img.logo(height='44', src='~/assets/logos/nodeinactive.svg', alt='')
  .add-node-btn.mx-auto
    button.btn.btn-dark.d-flex.justify-content-center.align-items-center Add Node
</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
      loading: false,
      node_items: [
        {
          node_name: 'Mein Node',
          node_link: 'wss://node.graphenelab.io',
          node_time: '0.0896',
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
.personal-nodes {
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
    &.personal-green {
      color: #1fc781;
    }
    &.warning {
      color: #f96c6c;
    }
  }
  .node-status img {
    width: 10px;
    height: 10px;
  }
  .add-node-btn button {
    width: 256px;
    height: 32px;
    background: #161617 !important;
  }
}
</style>
