<template lang="pug">
.page-header-progress.lg-4.md-4.sm-12.xm-12
  .progress-info(v-if='total')
    .info-capacity.d-flex.justify-content-between
      .d-flex.align-items-center
        el-tooltip(
          content='RAM is used for storing the data of decentralized applications in the WAX blockchain',
          placement='bottom',
          effect='light',
          :visible-arrow='false'
        )
          .ques-symbol.border-radius5.d-flex.align-items-center.justify-content-center ?
        span RAM: {{ usage }} / {{ total }}KB
      .d-flex.align-items-center
        span.more-button Buy more
        button.btn.plus-icon.border-radius5.p-0.d-flex.align-items-center.justify-content-center(
          @click='() => (onDialog = true)'
        ) +
    el-progress.completed-sets-progress(
      :text-inside='true',
      :stroke-width='26',
      :percentage='value',
      color='#67C23A'
    )
    el-dialog.buy-ram-dialog(:visible.sync='onDialog')
      el-progress(
        type='circle',
        :percentage='+value',
        :stroke-width='33',
        stroke-linecap='butt',
        color='#486CF7',
        :width='140'
      )
      p.mt-3 {{ usage }} KB / {{ total }} KB
      p.w-100.balance Balance: {{ balance }} WAX
      form.w-100(name='buyRAMForm', @submit='handleBuy')
        input.amount-input.w-100(
          type='number',
          :min='0',
          :max='balance',
          required,
          @input='(e) => (amount = e.target.value)'
        )
        button.btn.btn-buy.w-100.d-flex.align-items-center.justify-content-center(
          type='submit'
        ) Buy RAM
      .dialog-header.d-flex.align-items-center(slot='title')
        img(src='~/assets/images/Union.svg')
        p.dialog-title.ml-2 Buy RAM
</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
      onDialog: false,
      amount: 0,
    }
  },
  computed: {
    ...mapState(['user', 'account']),
    usage() {
      if (this.account) {
        return (this.account.ram_usage / 1024).toFixed(2)
      } else return 0
    },
    total() {
      if (this.account) {
        return (this.account.ram_quota / 1024).toFixed(2)
      } else return 0
    },
    value() {
      return ((this.usage / this.total) * 100).toFixed()
    },
    balance() {
      if (this.user.balances.find((item) => item.currency === 'WAX')) {
        return (+this.user.balances.find((item) => item.currency === 'WAX')
          .amount).toFixed(3)
      } else {
        return 0
      }
    },
  },
  methods: {
    handleClose() {
      this.onDialog = false
    },
    async handleBuy(e) {
      e.preventDefault()
      const actions = [
        {
          account: 'eosio',
          name: 'buyram',
          authorization: [
            {
              actor: this.user.name,
              permission: 'active',
            },
          ],
          data: {
            payer: this.user.name,
            receiver: this.user.name,
            quant: (+this.amount).toFixed(8) + ' WAX',
          },
        },
      ]
      console.log(actions)
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
      } catch (e) {
        console.log('Buy RAM err:', e)
      } finally {
        this.onDialog = false
      }
    },
  },
}
</script>
<style lang="scss">
.progress-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-progress.completed-sets-progress {
  width: 288px;
  background: #161617;
  border-radius: 4px;

  .el-progress-bar__outer {
    border-radius: 4px;

    .el-progress-bar__inner {
      border-radius: 4px;
    }
  }
}

.theme-dark .el-tooltip__popper.is-light {
  border: 0;
  max-width: 230px;
  font-size: 14px;
  //   background-color: var(--background-color-base);
}

.page-header-progress {
  .buy-ram-dialog {
    .dialog-title {
      font-size: 14px;
    }

    .el-dialog {
      width: 304px;

      .el-dialog__header {
        padding: 0 20px;
        height: 38px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(60, 60, 67, 0.36);
      }

      .el-dialog__headerbtn {
        top: 7px;
        right: 20px;
        width: 20px;

        i {
          color: white;
          font-weight: 700;
        }
      }

      .el-dialog__body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;

        .el-progress-circle__track {
          stroke: #333333;
        }

        .balance {
          margin-top: 12px;
          margin-bottom: 3px;
        }

        .amount-input {
          height: 30px;
          background: #161617;
          border: 0;
          color: white;
          margin-bottom: 18px;
        }

        .btn-buy {
          height: 44px;
          border-radius: 8px;
          background-color: #333333;
          color: #67c23a;
          font-size: 14px;
        }
      }
    }
  }

  .radius5 {
    border-radius: 5px;
  }

  .progress {
    margin-top: 4px;
    background-color: #161617;
    height: 26px;

    .progress-bar {
      background-color: #67c23a;
      color: black;
      text-align: right;
      font-weight: 500;
      font-size: 14px;
      padding-right: 5px;
    }
  }

  .capacity-info {
    margin-bottom: 6px;
  }

  .more-button {
    color: #67c23a;
    margin-right: 8px;
    font-size: 14px;
  }

  .ques-symbol {
    width: 20px;
    height: 20px;
    cursor: default;
    color: #9f979a;
    background-color: #202021;
    margin-right: 6px;
    font-weight: 700;
  }

  .plus-icon {
    font-size: 16px;
    color: black;
    background-color: #67c23a;
    width: 20px;
    height: 20px;
  }
}
</style>
