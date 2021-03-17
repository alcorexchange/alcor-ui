<template>
  <div class="connect-nav">
    <div class="left">
      <el-dropdown trigger="click">
        <div class="network-selection">
          <span>EOS MAINNET</span>
          <i class="el-icon-arrow-down" />
        </div>
        <template #dropdown>
          <el-dropdown-menu class="dropdown-container">
            <div class="d-item">item</div>
            <div class="d-item">item</div>
            <div class="d-item">item</div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="right">
      <AlcorButton
        @click="$store.dispatch('modal/login')"
        class="connect-button always-dark"
      >
        Connect Wallet
      </AlcorButton>
      <el-dropdown trigger="click">
        <div class="">
          <AlcorButton class="always-dark" :iconOnly="true">
            <i class="el-icon-more" />
          </AlcorButton>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="dropdown-container">
            <a class="d-item">
              <!-- <i class="el-icon-help"></i> -->
              Help Center
            </a>
            <a class="d-item">Telegram</a>
            <a class="d-item">Twitter</a>
            <a class="d-item">
              <!-- <i class="el-icon-document"></i> -->
              Docs
            </a>
            <AlcorButton
              :iconOnlyAlt="true"
              class="theme-toggle-button"
              @click="$store.dispatch('toggleTheme')"
            >
              <i class="el-icon-sunny" v-if="theme == 'dark'"></i>
              <i class="el-icon-moon" v-else></i>
            </AlcorButton>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
// import AlcorLink from '@/components/AlcorLink'
export default {
  components: {
    AlcorButton
    // AlcorLink
  }
  //   props: {
  //     isFooter: {
  //       default: false,
  //       type: Boolean
  //     }
  //   }
}
</script>

<style scoped lang="scss">
.connect-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.theme-toggle-button {
  border-radius: 50% !important;
  margin: 4px 8px;
  color: var(--text-default) !important;
}
.d-item {
  display: flex;
  text-align: center;
  padding: 4px 12px;
  min-width: 150px;
  color: var(--text-default);
  cursor: pointer;
  &:hover {
    background: var(--hover);
  }
}
.connect-button {
  margin: 0 4px;
}
.network-selection {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 14px;
  color: var(--text-default);
  span {
    margin-right: 4px;
  }
}
</style>
