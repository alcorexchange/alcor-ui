<template lang="pug">
.header-container
  .analytics-token-header
    .name-and-image
      img.image(:src="$tokenLogo(token.symbol, token.contract)" )
      .name.fs-32 {{ token.symbol }}

    a(:href='monitorAccount(token.contract)' target='_blank').contract.fs-20 ({{ token.contract }})

    .price.fs-24 ${{ token.usd_price.toFixed(10) }}
    //.change.fs-14 +todo% TODO

  .actions.mt-3
    AlcorButton(v-if="fundamental && fundamental.website" @click="openInNewTab(fundamental.website.link)") Website

    //a(tag="AlcorButton").value.link(v-if="fundamental && fundamental.website" :href="fundamental.website.link") {{ fundamental.website.name }}

    el-select(v-if="fundamental && fundamental.socials" @change="openSocial" placeholder="Socials" :value="null")
     el-option(v-for="social in fundamental.socials" :value="social") {{ social }}

    AlcorButton(v-if="fundamental && fundamental.github" @click="openInNewTab(fundamental.github)") Source Code
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'AnalyticsTokenHeader',

  components: {
    AlcorButton,
  },

  props: ['token', 'fundamental'],

  methods: {
    openSocial(social) {
      this.openInNewTab(social)
    },
  },
}
</script>

<style scoped lang="scss">
.analytics-token-header {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
  .name-and-image {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .image {
    width: 32px;
  }
  .contract {
    color: var(--text-disable);
    margin: 0 4px;
    transition: all 0.2s;
    &:hover {
      color: var(--text-default);
    }
  }
  .name,
  .price {
    line-height: 1.2;
  }
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  ::v-deep {
    .el-input__inner {
      width: 120px;
      padding-left: 8px;
      height: 32px;
      line-height: 32px;
    }
    .el-input__suffix {
      display: flex;
      align-items: center;
    }
  }
}
</style>
