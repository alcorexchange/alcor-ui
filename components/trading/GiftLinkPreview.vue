<template lang="pug">
#offer-preview-component.d-flex.flex-column.gap-16.mt-4
  .d-flex.justify-content-center.status.w-100(v-if="link.state == 1")
    | Link created on {{ date }}
  .d-flex.justify-content-center.status.cancelled.w-100(v-if="link.state == 2")
    | The link was cancelled on {{ updateDate }}
  .d-flex.justify-content-between.align-items-center.w-100
    .d-flex.gap-4.fs-14
      span ID:
      router-link(:to="{ name: `trading-gift-links-id___${$i18n.locale}`, params: { id: link.link_id } }")
        .color-wax {{ '#' + link.link_id }}
      span Created:
      span {{ date }}

    .d-flex.gap-4
      alcor-button(v-if="!previewMode" outline @click="cancelGifts")
        i.el-icon-delete
        span Cancel
  .d-flex.gap-8.flex-column.details
    .d-flex.justify-content-between
      assets-field.assets(v-if="link.assets" :assets="link.assets" smallCards="true")

  alcor-collapse(v-if="link.memo")
    .d-flex.align-items-center.gap-8(slot="title")
      i.el-icon-chat-square
      .fs-14 Memo: {{ link.memo }}

</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import AlcorCollapse from '~/components/AlcorCollapse'
import AssetsField from '~/components/nft_markets/AssetsField'
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { AlcorButton, AlcorCollapse, AssetsField, ProfileImage },
  props: ['link', 'previewMode'],
  computed: {
    date() {
      return new Date(+this.link.created_at_time).toLocaleString()
    },
    updateDate() {
      return new Date(+this.link.updated_at_time).toLocaleString()
    }
  },
  methods: {
    goToProfile(id) {
      this.$router.push({
        name: `account-id-nfts-inventory___${this.$i18n.locale}`,
        params: { id },
        query: {
          match: '',
          collection: null,
          sorting: null,
          minMint: null,
          maxMint: null,
          minPrice: null,
          maxPrice: null,
          isDuplicates: null,
          isBacked: null
        }
      })
    },
    async cancelGifts() {
      await this.$store.dispatch('chain/cancelGifts', [
        { link_id: this.link.link_id }
      ])
    }
  }
}
</script>

<style lang="scss">
#offer-preview-component {
  .el-collapse {
    border: none;

    .el-collapse-item__wrap {
      background: var(--background-color-secondary);
      border: none;
    }
    .el-collapse-item__header {
      background: var(--background-color-secondary);
      border: none;
    }
  }
}
</style>

<style lang="scss" scoped>
#offer-preview-component {
  width: 730px;
  padding: 42px 24px;
  border-radius: 1rem;
  background-color: var(--bg-alter-2);
  position: relative;

  .status {
    padding: 5px;
    border-top-left-radius: 17px;
    border-top-right-radius: 17px;
    background: var(--btn-active);
    position: absolute;
    top: 0;
    left: 0;

    &.cancelled {
      background: var(--main-wax);
    }
  }

  .account {
    width: 100%;
    padding: 10px;
    border-radius: 0.5rem;
    background-color: var(--bg-alter-2);
  }

  .list-item {
    border-radius: 0.5rem;

    &:nth-of-type(2n-1) {
      background-color: var(--bg-alter-2);
    }
  }

  .details {
    background-color: var(--background-color-secondary);
    border-radius: 0.5rem;
    margin-top: 16px;
    padding: 42px;
  }
  .assets {
    border: none;
    width: 100%;
    height: 320px;
  }
  .r-45 {
    transform: rotate(90deg);
  }
  .message {
    padding: 10px;
    background-color: var(--bg-alter-2);
    border-radius: 0 5px 5px 5px;
    width: fit-content;
  }
}
</style>
