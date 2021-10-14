<template lang="pug">
  el-dialog(:visible.sync="visible"  width="400px").dialog
    template(#title)
        .title-container
            i.el-icon-info
            .text NFT Details
    .main
      .title Immutable data:
      .item(v-for="value, key, i in fields.idata")
        span.key {{key}}:&nbsp;
        span.value {{value}}
      .title.mt-4 Mutable data:
      .item(v-for="value, key, i in fields.mdata")
        span.key {{key}}:&nbsp;
        span.value {{value}}
      AlcorButton.done(@click="closePopup") Done
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  name: 'DepositPopup',
  components: {
    AlcorButton
  },
  data: () => ({
    visible: false,
    fields: {}
  }),
  methods: {
    openPopup({ fields }) {
      this.fields = fields
      this.visible = true
    },
    closePopup() {
      this.visible = false
    }
  }
}
</script>

<style scoped lang="scss">
.dialog::v-deep {
  .el-dialog__body {
    padding: 20px;
    padding-top: 0;
  }
}
.title-container {
  display: flex;
  align-items: center;
  .text {
    font-weight: 500;
    padding-left: 8px;
  }
}
.main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: var(--text-default);
  font-size: 1rem;
}
.title {
  font-size: 1.2rem;
  text-align: center;
  margin: 10px 0;
  font-weight: 500;
}
.item {
  width: 100%;
  .key {
    opacity: 0.8;
  }
}
.done {
  width: 100%;
  color: var(--main-green);
  padding: 10px;
  border-radius: 10px;
  margin-top: 20px;
}
</style>
