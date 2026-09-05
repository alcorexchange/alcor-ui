<template lang="pug">
.staking-faq
  ElCollapse(v-model="active" accordion)
    ElCollapseItem(v-for="item in items"  :name="item.name")
      template(#title)
        div.p-3 {{ item.title }}
      p.p-3(v-for="description in item.descriptions") {{ description }}
      //- learn more link, only show on last item
      el-link.learn-more-link.hover-opacity.pl-3(v-if="item.name === '4'" href="https://docs.alcor.exchange/lsw-liquid-staked-wax" target="_blank") Learn more
</template>

<script>
export default {
  name: 'StakingFAQ',
  data: () => ({
    active: undefined,
  }),
  computed: {
    items() {
      return [
        {
          title: 'What is Liquid Staked WAX?',
          descriptions: [
            'Liquid Staked WAX ($LSW) offers a liquid staking solution for WAX. By staking your WAX coins with Alcor DEX, you receive an on-chain representation of your staking position a the $LSW token. This allows you to participate in DeFi activities while maximizing earning WAX DeFi APR rewards.',
          ],
          name: '1',
        },
        {
          title: 'How does it compare to staking individually?',
          descriptions: [
            'Alcor handles voting and restaking on behalf of users, ensuring maximum APR while also providing a Liquid Staked Token that can be used in various DeFi activities, including Spot, farms, and possibly upcoming lending and borrowing.',
            'Wallets participating in the protocol will be taken into account for airdrops from partnered projects and taken into account retroactively in points programs.',
          ],
          name: '2',
        },
        {
          title: 'How is the exchange rate between LSW and WAX calculated?',
          descriptions: [
            "When a user stakes WAX by depositing it into the Alcor Staking Contract, the contract calculates the amount of $LSW to mint based on the current exchange rate of WAX. It then mints $LSW and credits it to the user's account, which can be used across various DeFi platforms.",
            'The formula considers the total native WAX (staked plus rewards) against the total $LSW minted.',
            'LSW will constantly gets more expensive in terms of WAX about ~8% a year',
          ],
          name: '3',
        },
        {
          title: 'What happens when I want to withdraw my staked WAX?',
          descriptions: [
            'Users can withdraw their WAX, subject to a 3-day unbonding period, or swap their $LSW for WAX instantly on Alcor or other listed DEXes for immediate access to their assets.',
          ],
          name: '4',
        },
      ]
    },
  },
}
</script>

<style scoped lang="scss">
.staking-faq {
  &::v-deep {
    .el-collapse {
      border-radius: 8px;
      overflow: hidden;
    }
    .el-collapse-item__header {
      line-height: 1.5;
      height: auto;
    }
    .el-collapse-item__content {
      border-left: 1px solid var(--main-action-green);
    }
  }
  .learn-more-link {
    color: var(--main-action-green);
    &:hover {
      color: var(--main-action-green);
    }
  }
}
</style>
